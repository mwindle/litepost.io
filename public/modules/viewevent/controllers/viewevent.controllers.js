/*
* Controller for viewing an event. An event can be viewed before, during, and after it's 
* active with this controller. 
*/
(function () {
  'use strict';

  angular.module('viewevent').controller('EventController', 
  	function ($scope, $stateParams, $location, $anchorScroll, 
      parallaxHelper, $timeout, Event, Message, EventSocket, title) {
    
    // Grab the event channel from the current state
    $scope.channel = $stateParams.channel;
    
    // Start with an empty array for this event's messages
    $scope.messages = [];

    // Setup parallax scrolling animation
    $scope.background = parallaxHelper.createAnimator(-0.15);
    $anchorScroll.yOffset = 120;

    // Connect to the socket associated with this event
    EventSocket.connect($scope.channel);

    // Disconnect from the event's socket when this $scope is destroyed
    $scope.$on('$destroy', function () {
      EventSocket.disconnect();
    });

    // Listen to typing events that indicate an author is typing a message for this event
    EventSocket.on('typing', function () {
      $scope.typing = true;
    });

    // Listen to stop-typing events
    EventSocket.on('stop-typing', function () { 
      $scope.typing = false;
    });

    // Prepend new messages to the local messages array
    EventSocket.on('new-message', function (message) {
      $scope.messages.unshift(new Message(message));
    });

    // Update local message when an update comes from the socket
    EventSocket.on('update-message', function (message) {
      for(var i=0; i<$scope.messages.length; i++) {
        if($scope.messages[i]._id === message._id) {
          $scope.messages[i] = new Message(message);
          return;
        }
      }
    });

    // Delete local message when a delete comes from the socket
    EventSocket.on('delete-message', function (message) {
      for(var i=0; i<$scope.messages.length; i++) {
        if($scope.messages[i]._id === message._id) {
          $scope.messages.splice(i, 1);
          return;
        }
      }
    });

    // Listen to metadata updates on the event socket
    EventSocket.on('event-meta-update', function (meta) {
      $scope.viewers = meta.viewers;
    });

    // Load the event with the provided channel
    $scope.event = Event.get({ channel: $scope.channel }, function () {
      // Update the page title to customize it based on the event
      $scope.setPageTitle();

      // Start a countdown if this event is in the future
      $scope.updateCountdown();
    });

    /**
    * Sets/updates the title of the page depending on the state of this controller
    */
    $scope.setPageTitle = function () {
      var t = 'LitePost.io';
      if($scope.event && $scope.event.name) {
        t = $scope.event.name + ' - ' + t;
        if($scope.messages) {
          t = '(' + $scope.messages.length + ') ' + t;
        }
      } else {
        t = 'Event - ' + t;
      }
      title.set(t);
    };

    $scope.isEventInPast = function () {
      return !!$scope.event.start && moment($scope.event.start).unix() < moment().unix();
    };

    $scope.isEventInFuture = function () {
      return !!$scope.event.start && moment($scope.event.start).unix() > moment().unix();
    };

    /**
    * Start a countdown to the event if it's in the future
    */
    $scope.updateCountdown = function () {
      if($scope.isEventInFuture()) {
        var duration = moment.duration(moment($scope.event.start).diff(moment(), 'milliseconds', true));
        $scope.countdownClock = angular.element('#countdown-clock').FlipClock(duration.asSeconds(), {
          clockFace: 'DailyCounter',
          countdown: true
        });
      }
    };

    // Fetch all the messages for this event
    Message.query({ channel: $scope.channel }, function (messages) {
      // Append server-sorted (sent desc) messages to local $scope array
      $scope.messages = $scope.messages.concat(messages);

      // Update the page title to reflect any updates to unread count
      $scope.setPageTitle();

      /** 
      * Scroll to the hashed message if it's set.
      * The use of $timeout is a hack. There isn't a good way to detect when the DOM is completely
      * constructed AND rendered with CSS applied (ie fully loaded). That is necessary to determine
      * the actual scroll position. The use of $timeout will ensure the scrolling takes place the 
      * specified amount of milliseconds after the DOM is constructed, meaning that's how much time
      * it's allowing for the rendering. This may not work on slower systems. One could argue for the 
      * complete removal of this hash-linking capability because of this inconsistent behavior. 
      */
      if($location.hash()) {
        $timeout(function () {
          $anchorScroll();
        }, 500);
      }
    });

  });
})();
