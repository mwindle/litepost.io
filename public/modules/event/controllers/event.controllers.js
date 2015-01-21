/*
* Controller for viewing an event. An event can be viewed before, during, and after it's 
* active with this controller. 
*/
(function () {
  'use strict';

  angular.module('event').controller('EventController', 
  	function ($scope, $stateParams, $location, $anchorScroll, 
      parallaxHelper, $timeout, AuthService, Token, User, Event, Message, EventSocket, title, $document) {
    
    // Grab the username and event slug from the current state
    $scope.username = $stateParams.username;
    $scope.slug = $stateParams.slug;
    
    // Start with an empty array for this event's messages
    $scope.messages = [];
    $scope.unread = [];

    $scope.disqusUrl = 'https://litepost.io/app/' + $scope.username + '/' + $scope.slug;

    // Setup parallax scrolling animation
    $scope.background = parallaxHelper.createAnimator(-0.15);
    $anchorScroll.yOffset = 120;

    // Load the owner of this event
    $scope.user = User.get({ username: $scope.username });

    function updateTimeTillEvent ($scope) {
      if($scope.event.start) {
        $scope.timeTillEvent = Math.max(0, moment($scope.event.start).diff(moment(), 'second'));
        if($scope.timeTillEvent) {
          var secondsTillNextUpdate = Math.round($scope.timeTillEvent / 2);
          (function ($scope) {
            $timeout(function () {
              updateTimeTillEvent($scope);
            }, secondsTillNextUpdate * 1000);
          })($scope);
        }
      } else {
        $scope.timeTillEvent = 0;
      }
    }

    // Load the event with the provided username and slug
    $scope.event = Event.get({ 
      username: $scope.username, 
      slug: $scope.slug
    }, function (event) {
      $scope.setupSocket();
      $scope.messages = Message.query({ event: event._id, populate: 'author' });
      updateTimeTillEvent($scope);
    }, function (err) {
      $scope.event = null;
      $scope.error = $scope.error || {};
      $scope.error.failedToLoadEvent = true;
      $scope.error.status = err.status;
    });


    $scope.setupSocket = function () {

      // Disconnect from the event's socket when this $scope is destroyed
      $scope.$on('$destroy', function () {
        EventSocket.disconnect();
      });

      // Connect to the socket associated with this event
      EventSocket.connect($scope.event.socket, Token.get());

      // Listen to typing events that indicate an author is typing a message for this event
      EventSocket.on('typing', function (data) {
        $scope.typing = data || true;
      });

      // Listen to stop-typing events
      EventSocket.on('stop-typing', function () { 
        $scope.typing = false;
      });

      // Prepend new messages to the local messages array
      EventSocket.on('new-message', function (message) {
        $scope.unread.push(message);
        $scope.showUnread();
      });

      function indexOfMessage(array, message) {
        for(var i=0; i<array.length; i++) {
          if(array[i]._id === message._id) {
            return i;
          }
        }
        return -1;      
      }

      // Update local message when an update comes from the socket
      EventSocket.on('update-message', function (message) {        
        var i = indexOfMessage($scope.unread, message);
        if(i >= 0) {
          $scope.unread[i] = new Message(message);
        }
        i = indexOfMessage($scope.messages, message);
        if(i >= 0) {
          $scope.messages[i] = new Message(message);
        }
      });

      // Delete local message when a delete comes from the socket
      EventSocket.on('delete-message', function (message) {
        var i = indexOfMessage($scope.unread, message);
        if(i >= 0) {
          $scope.unread.splice(i, 1);
        }
        i = indexOfMessage($scope.messages, message);
        if(i >= 0) {
          $scope.messages.splice(i, 1);
        }        
      });

      // Listen to metadata updates on the event socket
      EventSocket.on('event-meta-update', function (meta) {
        $scope.viewers = meta.viewers;
      });
    };

    $scope.showUnread = function (show) {
      $scope.show = arguments.length ? show : $scope.show;
      if($scope.show) {
        $scope.unread.forEach(function (message) {
          $scope.messages.unshift(message);
        });
        $scope.unread = [];
      }
    };

    $scope.scrollToUnread = function () {
      $document.scrollTopAnimated(200);
    };

    /**
    * Sets/updates the title of the page depending on the state of this controller
    */
    $scope.setPageTitle = function () {
      if(!title) {
        return;
      }
      var t = 'LitePost.io';
      if($scope.event && $scope.event.name) {
        t = $scope.event.name;
        if($scope.user) {
          t += ' by ' + $scope.user.name || '@'+$scope.user.username;
        }
        if($scope.unread.length) {
          t = '(' + $scope.unread.length + ') ' + t;
        }
      } else {
        t = 'Event - ' + t;
      }
      title.set(t);
    };
    $scope.$watch('event.$resolved', $scope.setPageTitle);
    $scope.$watch('user.$resolved', $scope.setPageTitle);
    $scope.$watch('unread.length', $scope.setPageTitle);

    $scope.canEditEvent = function () {
      return AuthService.isLoggedIn() && $scope.user && 
        $scope.user._id && AuthService.user()._id === $scope.user._id;
    };

  })


  /**
  * Controller for managing the settings of an event
  */
  .controller('EventSettingsController', function ($scope, $location, $state, $stateParams, $timeout, Event) {
    $scope.username = $stateParams.username;
    $scope.slug = $stateParams.slug;
    $scope.baseEventUrl = $location.host() + 
      $state.href('app.event', { username: $scope.username, slug: '' });
    $scope.event = Event.get({ username: $scope.username, slug: $scope.slug }, function () {
      $scope.updatedEvent = angular.copy($scope.event);

      if($stateParams.s) {
        eventSaved();
      }
    });

    function eventSaved () {
      $scope.savingEvent = $scope.savingEvent || {};
      $scope.savingEvent.pending = false;
      $scope.savingEvent.success = true;
      $scope.eventForm.$setPristine();
      $timeout.cancel($scope.savedEventTimeout);
      $scope.savedEventTimeout = $timeout(function () {
        $scope.savingEvent = {};
      }, 3000);
    }

    $scope.save = function () {
      $scope.savingEvent = { pending: true };
      $scope.updatedEvent.$save(function (event) {
        // If the event slug has changed, we need to re-route
        if($scope.event.slug !== event.slug) {
          return $state.go('app.editEvent', { username: $scope.username, slug: event.slug, s: true });
        }
        $scope.event = angular.copy(event);
        eventSaved();
      });
    };

    $scope.delete = function () {
      $scope.event.$delete(function (event) {
        $state.go('app.profile', { username: $scope.username });
      });
    };
  });

})();
