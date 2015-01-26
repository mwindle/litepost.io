/*
* Controllers for postmessage module
*/
(function () {
  'use strict';

  /**
  * Supports creating and editing messages
  */
  angular.module('postmessage').controller('PostController', 
    function ($scope, $state, $stateParams, $timeout, Event, Message, EventSocket, 
      $modal, parallaxHelper, title, pageClass) {

    $scope.username = $stateParams.username;
    $scope.slug = $stateParams.slug;
    $scope.messageId = $stateParams.messageId; // Optional, null = create, !null = edit

    $scope.maxPostLength = 1000;
    $scope.typing = false;
    $scope.background = parallaxHelper.createAnimator(-0.3);

    pageClass.set('postmessage');
    $scope.$on('$destroy', function () {
      pageClass.set('');
    });

    /**
    * event is a required property for a message
    */
    $scope.$watch('event.id', function () {
      // Users that don't have edit perms on an event can't post messages in them
      if(!$scope.isUpdatingExisting() && !$scope.canEditEvent($scope.event)) {
        $state.go('app.event', { username: $scope.username, slug: $scope.slug });
      }
      $scope.editingMessage.event = $scope.event.id;
    });

    /**
    * Returns a boolean that indicates if the message has completed loading. 
    */
    $scope.isMessageLoaded = function () {
      return !!$scope.editingMessage.event;
    };

    /**
    * For the view to determine create vs edit
    */
    $scope.isUpdatingExisting = function () {
      return !!$scope.messageId;
    };

    /**
    * Fires when typing happens in the editor
    */
    $scope.textChanged = function () {
      $scope.edited($scope.editingMessage.text || '');
    };

    /**
    * Called with updated text value, processes markdown to html for display. Informs
    * socket that typing is taking place. 
    */
    $scope.edited = function (content) {
      // Update the editingMessage object with the changes made in the editor
      $scope.editingMessage.text = content;
      $scope.editingMessage.html = marked(content);
      $scope.editingMessage.updated = new Date();

      // Send a socket message to indicate typing has started
      if(!$scope.isTyping()) {
        $scope.startTyping();
      }

      /**
      * Send a socket message to indicate typing has stopped if another key isn't pressed 
      * in the allotted time, otherwise resend the typing message so any new clients get it
      * and it allows them to have a timeout so typing doesn't happen forever if the author's
      * browser crashes. 
      */
      (function (lastEditingTime) {
        $timeout(function () {
          // Message hasn't been edited within the timeout
          if($scope.editingMessage && lastEditingTime===$scope.editingMessage.updated) {
            $scope.stopTyping();
          } else if($scope.editingMessage && moment().diff($scope.typing, 'seconds') > 5) {
            // Haven't sent another typing heartbeat in 5s, send another
            $scope.startTyping();
          }
        }, 10000);
      })($scope.editingMessage.updated);
    };

    /**
    * Cleans up and changes state back to the event
    */
    $scope.disableEditing = function () {
      $scope.editingMessage = null;
      $scope.stopTyping();
      $state.go('app.event', $stateParams);
    };

    $scope.isTyping = function () {
      return $scope.typing;
    };

    /**
    * Inform socket clients author is typing
    */
    $scope.startTyping = function () {
      EventSocket.emit('typing');
      $scope.typing = moment();
    };

    /**
    * Inform socket clients author has stopped typing
    */
    $scope.stopTyping = function () {
      EventSocket.emit('stop-typing');
      $scope.typing = false;
    };

    /**
    * Publish message
    */
    $scope.publish = function () {
      if($scope.isMessageLoaded() && $scope.editingMessage.text) {
        $scope.editingMessage.$save(function (message) {
          $scope.disableEditing();
        }, function (err) {
          //todo
          console.log('unable to save message %j', err);
        });
      }
    };

    /**
    * Update an existing message
    */
    $scope.update = function () {
      $scope.publish();
    };

    /**
    * Delete existing message
    */
    $scope.delete = function () {
      if($scope.isUpdatingExisting() && $scope.isMessageLoaded()) {
        $scope.editingMessage.$delete(function (message) {
          $scope.editingMessage = null;
          $scope.disableEditing();
        }, function (err) {
          //todo
          console.log('unable to delete message %j', err);
        });
      }
    };

    if($scope.messageId) {
      title.set('Edit Message');
      $scope.editingMessage = Message.get({ id: $scope.messageId, populate: 'author' }, function () {
        // Ensure the user is authorized to edit this message
        if(!$scope.canEditMessage($scope.editingMessage)) {
          $state.go('app.event', { username: $scope.username, slug: $scope.slug });
        }
      }, function (err) {
        //todo
        console.log('unable to load message %j', err);
      });
    } else {
      title.set('New Message');
      $scope.editingMessage = new Message({ 
        text: '',
        html: ''
      });
    }

  });

})();
