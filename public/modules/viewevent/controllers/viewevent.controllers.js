/*
* Controller for viewing an event. An event can be viewed before, during, and after it's 
* active with this controller. 
*/
(function () {
  'use strict';

  angular.module('viewevent').controller('EventController', 
  	function ($scope, $stateParams, $location, $anchorScroll, 
      parallaxHelper, $timeout, User, Event, Message, EventSocket, title) {
    
    // Grab the username and event slug from the current state
    $scope.username = $stateParams.username;
    $scope.slug = $stateParams.slug;
    
    // Start with an empty array for this event's messages
    $scope.messages = [];

    // Setup parallax scrolling animation
    $scope.background = parallaxHelper.createAnimator(-0.15);
    $anchorScroll.yOffset = 120;

    // Load the owner of this event
    $scope.user = User.get({ username: $scope.username });

    // Load the event with the provided username and slug
    $scope.event = Event.get({ 
      username: $scope.username, 
      slug: $scope.slug
    }, function (event) {
      $scope.setupSocket();
      $scope.messages = Message.query({ event: event._id, populate: 'author' });

      // Update the page title to customize it based on the event
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

    $scope.setupSocket = function () {

      // Disconnect from the event's socket when this $scope is destroyed
      $scope.$on('$destroy', function () {
        EventSocket.disconnect();
      });

      // Connect to the socket associated with this event
      EventSocket.connect($scope.event.socket);

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
    };

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

  })


  /**
  * Controller for managing the settings of an event
  */
  .controller('EventSettingsController', function ($scope, $location, $state, $stateParams, Event) {
    $scope.username = $stateParams.username;
    $scope.slug = $stateParams.slug;
    $scope.baseEventUrl = $location.host() + '/' + $scope.username + '/';
    $scope.event = Event.get({ username: $scope.username, slug: $scope.slug }, function () {
      $scope.updatedEvent = angular.copy($scope.event);
    });

    $scope.save = function () {
      $scope.updatedEvent.$save(function (event) {
        // If the event slug has changed, we need to re-route
        if($scope.event.slug !== event.slug) {
          return $state.go('app.editEvent', { username: $scope.username, slug: event.slug });
        }
        $scope.event = angular.copy(event);
      });
    };

    $scope.isRenameDisabled = function () {
      return !$scope.updatedEvent || !$scope.updatedEvent.name || $scope.updatedEvent.name===$scope.event.name;
    };

    $scope.rename = function () {
      $scope.event.name = $scope.updatedEvent.name;
      $scope.event.$save();
    };

    $scope.isSetStartDisabled = function () {
      return !$scope.updatedEvent || !$scope.updatedEvent.start || $scope.updatedEvent.start===$scope.event.start;
    };

    $scope.isRemoveStartDisabled = function () {
      return !$scope.event || !$scope.event.start;
    };

    $scope.setStart = function () {
      $scope.event.start = $scope.updatedEvent.start;
      $scope.event.$save(function (event) {
        $scope.updatedEvent.start = $scope.event.start;
      });
    };

    $scope.removeStart = function () {
      $scope.event.start = $scope.updatedEvent.start = null;
      $scope.event.$save();
    };

    $scope.isSetDescriptionDisabled = function () {
      return !$scope.updatedEvent || $scope.updatedEvent.description===$scope.event.description;
    };

    $scope.setDescription = function () {
      $scope.event.description = $scope.updatedEvent.description;
      $scope.event.$save();
    };

    $scope.isEventInPast = function () {
      return $scope.event.start && moment($scope.event.start).unix() < moment().unix();
    };

    $scope.setHidden = function () {
      $scope.event.hidden = $scope.updatedEvent.hidden;
      $scope.event.$save();
    };

    $scope.delete = function () {
      if($scope.deleteConfirmationName !== $scope.event.name) { 
        return; 
      }
      $scope.event.$delete(function (event) {
        $state.go('app.profile', { username: $scope.username });
      });
    };
  });

})();
