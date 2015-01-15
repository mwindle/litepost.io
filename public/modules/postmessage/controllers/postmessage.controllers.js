/*
* Controllers for postmessage module
*/
(function () {
  'use strict';

  angular.module('postmessage').controller('PostController', 
    function ($scope, $state, $stateParams, $timeout, Event, Message, EventSocket, parallaxHelper, title, pageClass) {
    $scope.username = $stateParams.username;
    $scope.slug = $stateParams.slug;
    $scope.maxPostLength = 1000;
    $scope.messageId = $stateParams.messageId;
    $scope.typing = false;
    $scope.background = parallaxHelper.createAnimator(-0.3);
    pageClass.set('postmessage');
    $scope.$on('$destroy', function () {
      pageClass.set('');
    });

    if($scope.messageId) {
      title.set('Edit Message');
      $scope.editingMessage = Message.get({ id: $scope.messageId, populate: 'author' });
    } else {
      title.set('New Message');
      $scope.editingMessage = new Message({ 
        text: '',
        html: ''
        //TODO: , author: me
      });
    }
    $scope.$watch('event._id', function () {
      $scope.editingMessage.event = $scope.event._id;
    });

    $scope.isMessageLoaded = function () {
      return $scope.event && $scope.event.$resolved && (!$scope.isUpdatingExisting() || $scope.editingMessage.$resolved);
    };

    $scope.isUpdatingExisting = function () {
      return !!$scope.messageId;
    };

    $scope.textChanged = function () {
      $scope.edited($scope.editingMessage.text || '');
    };

    $scope.edited = function (content) {
      // Update the editingMessage object with the changes made in the editor
      $scope.editingMessage.text = content;
      $scope.editingMessage.html = marked(content);
      $scope.editingMessage.sent = new Date();
      // Send a socket message to indicate typing has started
      if(!$scope.isTyping()) {
        $scope.startTyping();
      }
      // Send a socket message to indicate typing has stopped if another key isn't pressed in the allotted time
      (function (lastEditingTime) {
        $timeout(function () {
          if($scope.editingMessage && lastEditingTime===$scope.editingMessage.sent) {
            $scope.stopTyping();
          }
        }, 5000);
      })($scope.editingMessage.sent);
    };

    $scope.disableEditing = function () {
      $scope.editingMessage = null;
      $scope.stopTyping();
      $state.go('app.event', $stateParams);
    };

    $scope.isTyping = function () {
      return $scope.typing;
    };

    $scope.startTyping = function () {
      EventSocket.emit('typing');
      $scope.typing = true;
    };

    $scope.stopTyping = function () {
      EventSocket.emit('stop-typing');
      $scope.typing = false;
    };

    $scope.publish = function () {
      if($scope.editingMessage && $scope.editingMessage.text) {
        $scope.editingMessage.$save(function (message) {
          $scope.disableEditing();
        }, function (err) {
          console.log(err);
        });
      }
    };

    $scope.update = function () {
      $scope.publish();
    };

    $scope.delete = function () {
      if($scope.isUpdatingExisting() && $scope.isMessageLoaded()) {
        $scope.editingMessage.$delete().then(function (message) {
          $scope.editingMessage = null;
          $scope.disableEditing();
        });
      }
    };
  });
})();
