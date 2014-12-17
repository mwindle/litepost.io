/*
* Controllers for postmessage module
*/
(function () {
  'use strict';

  angular.module('postmessage').controller('PostController', 
    function ($scope, $state, $stateParams, $timeout, Event, Message, EventSocket, parallaxHelper) {
    $scope.channel = $stateParams.channel;
    $scope.messageId = $stateParams.messageId;
    $scope.event = Event.get({ channel: $scope.channel });
    $scope.title = 'New Message';
    $scope.pageClass = 'post';
    $scope.editor = angular.element('#m');
    $scope.typing = false;
    $scope.background = parallaxHelper.createAnimator(-0.3);
    EventSocket.connect($scope.channel);

    $scope.$on('$destroy', function () {
      EventSocket.disconnect();
    });

    if($scope.messageId) {
      $scope.editingMessage = Message.get({ 
        channel: $scope.channel, 
        id: $scope.messageId 
      }, function () {
        $scope.editor.val($scope.editingMessage.text);
      });
    } else {
      $scope.editingMessage = new Message({ 
        channel: $scope.channel,
        text: '',
        html: ''
      });
      $scope.editor.val($scope.editingMessage.text);
    }

    $scope.editor.markdown({
      fullscreen: { enable: false },
      hiddenButtons: ['Preview'],
      onChange: function (e) {
        $scope.$apply(function () {
          $scope.edited(e.getContent());
        });
      },
      onShow: function (e) {
        e.$textarea.css('resize', 'vertical');
      }
    });

    $scope.isMessageLoaded = function () {
      return !$scope.isUpdatingExisting() || $scope.editingMessage.$resolved;
    };

    $scope.isUpdatingExisting = function () {
      return !!$scope.messageId;
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
      $scope.editor.val('');
      $scope.stopTyping();
      $state.go('event', $stateParams);
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
        $scope.editingMessage.$save({ channel: $scope.channel }).then(function (message) {
          $scope.editingMessage = null;
          $scope.disableEditing();
        });
      }
    };

    $scope.update = function () {
      /* 
      Would like to have a custom state change with this to send the author back to the location
      of this message with //u/r/l#messageId but ui-router $state.go doesn't support a hash right now. 
      Watch https://github.com/angular-ui/ui-router/issues/510 
      */
      $scope.publish();
    };

    $scope.delete = function () {
      if($scope.editingMessage) {
        $scope.editingMessage.$delete({ channel: $scope.channel }).then(function (message) {
          $scope.editingMessage = null;
          $scope.disableEditing();
        });
      }
    };
  });
})();
