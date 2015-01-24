/**
* Event-related controllers
*/
(function () {
  'use strict';

  angular.module('event')

  /*
  * Controller for viewing an event.
  */
  .controller('EventController', 
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

    /**
    * Shows unread messages by moving them from the unread array to the message array. 
    * Maintains state of whether new messages are being shown.
    */
    $scope.showUnread = function (show) {
      $scope.show = arguments.length ? show : $scope.show;
      if($scope.show) {
        $scope.unread.forEach(function (message) {
          $scope.messages.unshift(message);
        });
        $scope.unread = [];
      }
    };

    /**
    * Uses duScroll to scroll to the top of the page in an animated way. 
    */
    $scope.scrollToUnread = function () {
      if('function' === typeof $document.scrollTopAnimated) {
        $document.scrollTopAnimated(200);
      }
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

    /**
    * Setup socket connection and listeners for the event. 
    * This should only be called after the event is successfully loaded. 
    */
    $scope.setupSocket = function () {

      /**
      * Disconnect from the event's socket when this $scope is destroyed
      */
      $scope.$on('$destroy', function () {
        EventSocket.disconnect();
      });

      /**
      * Connect to the socket associated with this event
      */
      EventSocket.connect($scope.event.socket, Token.get());

      /**
      * Listen to typing events that indicate an author is typing a message for this event
      */
      var lastTypingMessage;
      EventSocket.on('typing', function (data) {
        $scope.typing = data || true;
        /**
        * Set a timeout to clear typing state
        */
        lastTypingMessage = (new Date()).toString();
        (function (ltm) {
          $timeout(function () {
            /**
            * Haven't heard anything in 20s, server is supposed to send typing at least every 10s to
            * keep it alive. 
            */
            if($scope.typing && ltm===lastTypingMessage) {
              $scope.typing = false;
            }
          }, 20000);
        })(lastTypingMessage);
      });

      /**
      * Listen to stop-typing events
      */
      EventSocket.on('stop-typing', function () { 
        $scope.typing = false;
      });

      /**
      * Prepend new messages to the unread array. Calling showUnread will immediately
      * show them if the current state is set for that. 
      */
      EventSocket.on('new-message', function (message) {
        $scope.unread.push(message);
        $scope.showUnread();
      });

      /**
      * Helper function to find a message within an array. Uses the message
      * id to find it, can't use an equality check since some fields may differ.
      */
      function indexOfMessage(array, message) {
        for(var i=0; i<array.length; i++) {
          if(array[i].id === message.id) {
            return i;
          }
        }
        return -1;      
      }

      /**
      * Update local message when an update comes from the socket
      */
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

      /**
      * Delete local message when a delete comes from the socket
      */
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

      /**
      * Listen to metadata updates on the event socket to keep view count updated
      */
      EventSocket.on('event-meta-update', function (meta) {
        $scope.viewers = meta.viewers;
      });

    };

    // Load the owner of this event
    if($scope.username) {
      $scope.user = User.get({ username: $scope.username });
    }


    /**
    * Helper function that keeps the time until the event 'kinda' up to date so the view
    * has some idea of how close the event is. This function actually just updates the time
    * in a half-life sort of way so if the event is 100s away, it will udpate at 50s, 25s, 12s, etc.
    */
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
    if($scope.username && $scope.slug) {
      $scope.event = Event.get({ 
        username: $scope.username, 
        slug: $scope.slug
      }, function (event) {
        $scope.setupSocket();
        $scope.messages = Message.query({ event: event.id, populate: 'author' });
        updateTimeTillEvent($scope);
      }, function (err) {
        $scope.event = null;
        $scope.error = $scope.error || {};
        $scope.error.failedToLoadEvent = true;
        $scope.error.status = err.status;
      });
    }

  })


  /**
  * Controller for managing the settings of an event
  */
  .controller('EventSettingsController', function ($scope, $location, $state, $stateParams, $timeout, Event) {
    
    // Required state parameters
    $scope.username = $stateParams.username;
    $scope.slug = $stateParams.slug;

    if(!$scope.username || !$scope.slug) {
      // Send users back to their profile page if there's a state problem 
      $state.go('app.profile');
    }

    $scope.baseEventUrl = $location.host() + 
      $state.href('app.event', { username: $scope.username, slug: '' });
      
    /**
    * Updates some properties used by the view to let the user know when the event saved
    */
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

    /**
    * Save the changes to the event.
    */
    $scope.save = function () {
      $scope.savingEvent = { pending: true };
      $scope.updatedEvent.$save(function (event) {
        // If the event slug has changed, we need to re-route
        if($scope.event.slug !== event.slug) {
          return $state.go('app.editEvent', { username: $scope.username, slug: event.slug, s: true });
        }
        $scope.event = angular.copy(event);
        eventSaved();
      }, function (err) {
        // TODO:
        console.log('failed to update event: %j', err);
      });
    };

    /**
    * Delete the event
    */
    $scope.delete = function () {
      $scope.event.$delete(function (event) {
        $state.go('app.profile', { username: $scope.username });
      }, function (err) {
        //TODO: 
        console.log('failed to delete event: %j', err);
      });
    };
    
    $scope.event = Event.get({ username: $scope.username, slug: $scope.slug }, function () {
      
      /*
      * If the user isn't allowed to edit the event, get them out of here. 
      */
      if(!$scope.canEditEvent($scope.event)) {
        $state.go('app.profile');
      }

      $scope.updatedEvent = angular.copy($scope.event);

      /**
      * If s is set, it means the user updated the slug for this event and we had to do 
      * a state changed to get them to this page (since the slug is in the url). This just
      * shows that the event is saved. 
      */
      if($stateParams.s) {
        eventSaved();
      }
    });

  });

})();
