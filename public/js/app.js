(function(angular) {

'use strict';

// main module for single page todo application
angular.module('liveBlogApp', ['ngRoute', 'ngResource', 'ngSanitize', 'angularMoment'])

// REST $resource on server for messages
.factory('Message', ['$resource', function($resource) {
  return $resource('api/messages/:id', {id:'@_id'});
}])


// Service for socket.io
.factory('socket', function($rootScope) {
  var socket = io.connect();
  return {
    on: function(eventName, callback) {
      socket.on(eventName, function() {
        var args = arguments;
        $rootScope.$apply(function() {
          callback.apply(socket, args);
        });
      });
    },
    emit: function(eventName, data, callback) {
      socket.emit(eventName, data, function() {
        var args = arguments;
        $rootScope.$apply(function() {
          if(callback) { callback.apply(socket, args); }
        });
      });
    }
  };
})

// main controller for single page live blogging application
.controller('MainCtrl', function($scope, $location, $route, $routeParams, $timeout, Message, socket) {
  console.log($location.hash());
  console.log($route);
  console.log($routeParams);
  $scope.user = { _id: 1234, name: "Marc" };//TODO: Fetch from server when supported
  $scope.event = { name: "An Awesome Event", channel: "default" };//TODO: Fetch from server when supported
  $scope.messages = Message.query();
  $scope.editor = angular.element('#m');
  $scope.editing = false;
  $scope.typing = false;
  marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false
  });

  socket.on('typing', function() { 
    $scope.typing = true;
  });
  socket.on('stop-typing', function() { 
    $scope.typing = false;
  });
  socket.on('new-message', function(message) {
    $scope.messages.unshift(new Message(message));
  });
  socket.on('update-message', function(message) {
    for(var i=0; i<$scope.messages.length; i++) {
      if($scope.messages[i]._id == message._id) {
        $scope.messages[i] = new Message(message);
        return;
      }
    }
  });
  socket.on('delete-message', function(message) {
    for(var i=0; i<$scope.messages.length; i++) {
      if($scope.messages[i]._id == message._id) {
        $scope.messages.splice(i, 1);
        return;
      }
    }
  });


  $scope.editor.markdown({
    fullscreen: { enable: false },
    hiddenButtons: ['Preview'],
    onChange: function(e) {
      $scope.$apply(function() {
        $scope.edited(e.getContent());
      });
    }
  });

  $scope.edited = function(content) {
    // Update the editingMessage object with the changes made in the editor
    $scope.editingMessage.text = content;
    $scope.editingMessage.html = marked(content);
    $scope.editingMessage.sent = new Date();
    // Send a socket message to indicate typing has started
    if(!$scope.isTyping()) {
      $scope.startTyping();
    }
    // Send a socket message to indicate typing has stopped if another key isn't pressed in the allotted time
    (function(lastEditingTime) {
      $timeout(function() {
        if($scope.editingMessage && lastEditingTime==$scope.editingMessage.sent) {
          $scope.stopTyping();
        }
      }, 3000);
    })($scope.editingMessage.sent);
  };

  $scope.enableEditing = function(message) {
    $scope.editing = true;
    $scope.editingMessage = message || $scope.editingMessage || new Message({ 
      channel: $scope.event.channel,
      text: "",
      html: "<h2>Preview</h2>",
      sent: new Date()
    });
    $scope.editor.val($scope.editingMessage.text);
  };

  $scope.disableEditing = function() {
    $scope.editing = false;
    $scope.editor.val('');
    $scope.stopTyping();
  };

  $scope.isTyping = function() {
    return $scope.typing;
  }

  $scope.startTyping = function() {
    socket.emit('typing');
    $scope.typing = true;
  };

  $scope.stopTyping = function() {
    socket.emit('stop-typing');
    $scope.typing = false;
  };

  $scope.publish = function() {
    if($scope.editingMessage && $scope.editingMessage.text) {
      // Delete the html attribute of the editingMessage since it's ignored by the server anyway
      //delete $scope.editingMessage.html;
      $scope.editingMessage.$save().then(function(message) {
        $scope.editingMessage = null;
        $scope.disableEditing();
      });
    }
  };

  $scope.update = function() {
    $scope.publish();
  };

  $scope.delete = function() {
    if($scope.editingMessage) {
      $scope.editingMessage.$delete().then(function(message) {
        $scope.editingMessage = null;
        $scope.disableEditing();
      });
    }
  };

})



.config(function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(false);
  $locationProvider.hashPrefix('!');
});


})(window.angular);
