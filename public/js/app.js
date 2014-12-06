(function (angular, io, $, marked) {

'use strict';

// main module for single page todo application
angular.module('liveBlogApp', [
  'ui.router', 
  'mgcrea.ngStrap',
  'duParallax',
  'ngResource', 
  'ngSanitize', 
  'angularMoment'
])

.factory('Me', function ($resource) {
  return $resource('api/me');
})

.factory('MyEvents', function ($resource) {
  return $resource('api/me/events');
})

.factory('Event', function ($resource) {
  return $resource('api/events/:id', {id:'@_id'});
})

.factory('Message', function ($resource) {
  return $resource('api/events/:channel/messages/:id', {id:'@_id'});
})

.filter('unsafe', function ($sce) {
  return function (value) {
    return $sce.trustAsHtml(value);
  };
})

.directive('compileTemplate', function ($compile, $parse) {
  return {
    link: function (scope, element, attr) {
      var parsed = $parse(attr.ngBindHtml);
      function getStringValue() { return (parsed(scope) || '').toString(); }

      //Recompile if the template changes
      scope.$watch(getStringValue, function() {
        $compile(element, null, -9999)(scope);  //The -9999 makes it skip directives so that we do not recompile ourselves
      });
    }
  };
})

// Service for socket.io
.factory('socket', function ($rootScope) {
  var socket, room;
  return {
    connect: function (rm) {
      room = rm;
      socket = io();
      socket.on('connect', function () {
        socket.emit('join', room);
      });
      if(socket && socket.connected) { socket.emit('join', room); }
    },
    on: function (eventName, callback) {
      if(!socket) { return false; }
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      if(!socket) { return false; }
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if(callback) { callback.apply(socket, args); }
        });
      });
    },
    disconnect: function () {
      if(!socket) { return false; }
      socket.emit('leave', room);
    }
  };
})

.controller('MyEventsCtrl', function ($scope, Me, MyEvents, Event, Message) {
  $scope.user = Me.get(function (data) { 
    $scope.user.events = MyEvents.query(function(events) {
      for(var i=0; i<events.length; i++) {
        events[i].messages = Message.query({channel: events[i].channel});
        events[i].viewers = Math.round(Math.random()*1000);
      }
    });
  }, function (error) {
    window.location = '/login';
  });

})

.controller('CreateEventCtrl', function ($scope, $state, Me, MyEvents, Event, Message) {
  $scope.user = Me.get(function (data) { 
    $scope.user.events = MyEvents.query(function(events) {
      for(var i=0; i<events.length; i++) {
        events[i].messages = Message.query({channel: events[i].channel});
        events[i].viewers = Math.round(Math.random()*1000);
      }
    });
  }, function (error) {
    window.location = '/login';
  });

  $scope.createEvent = function () {
    new Event({
      channel: $scope.channel,
      name: $scope.name
    }).$save(function (event) {
      $scope.user.events.push(event);
      $scope.channel = $scope.name = '';
      $state.go('main');
    });
  };

})

// controller for managing the settings of an event
.controller('EventSettingsCtrl', function ($scope, $state, $stateParams, Event) {
  $scope.pageClass = 'settings';
  $scope.channel = $stateParams.channel;
  $scope.event = Event.get({ channel: $scope.channel }, function () {
    $scope.updatedEvent = angular.copy($scope.event);
  });

  $scope.isRenameDisabled = function () {
    return !$scope.updatedEvent || !$scope.updatedEvent.name || $scope.updatedEvent.name==$scope.event.name;
  };

  $scope.rename = function () {
    $scope.event.name = $scope.updatedEvent.name;
    $scope.event.$save();
  };

  $scope.isSetStartDisabled = function () {
    return !$scope.updatedEvent || !$scope.updatedEvent.start || $scope.updatedEvent.start==$scope.event.start;
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
    return !$scope.updatedEvent || $scope.updatedEvent.description==$scope.event.description;
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
      $state.go('main');
    });
  };
})

// event controller, shows the list of event messages and keeps them up to date
.controller('EventCtrl', function ($scope, $stateParams, $anchorScroll, parallaxHelper, $timeout, Event, Message, socket) {
  $scope.pageClass = 'event';
  $scope.channel = $stateParams.channel;
  $scope.messages = [];
  $scope.background = parallaxHelper.createAnimator(-0.15);
  socket.connect($scope.channel);

  $scope.$on("$destroy", function () {
    socket.disconnect();
  });

  socket.on('typing', function () { 
    $scope.typing = true;
  });

  socket.on('stop-typing', function () { 
    $scope.typing = false;
  });

  socket.on('new-message', function (message) {
    $scope.messages.unshift(new Message(message));
  });

  socket.on('update-message', function (message) {
    for(var i=0; i<$scope.messages.length; i++) {
      if($scope.messages[i]._id == message._id) {
        $scope.messages[i] = new Message(message);
        return;
      }
    }
  });

  socket.on('delete-message', function (message) {
    for(var i=0; i<$scope.messages.length; i++) {
      if($scope.messages[i]._id == message._id) {
        $scope.messages.splice(i, 1);
        return;
      }
    }
  });

  socket.on('event-meta-update', function (meta) {
    $scope.viewers = meta.viewers;
  });

  $scope.event = Event.get({ channel: $scope.channel }, function () {
    $scope.title = $scope.event.name;
    $scope.updateCountdown();
  });

  $scope.isEventInPast = function () {
    return !!$scope.event.start && moment($scope.event.start).unix() < moment().unix();
  };

  $scope.updateCountdown = function () {
    if(!$scope.isEventInPast()) {
      var duration = moment.duration(moment($scope.event.start).diff(moment(), 'milliseconds', true));
      $scope.countdownClock = $('#countdown-clock').FlipClock(duration.asSeconds(), {
        clockFace: 'DailyCounter',
        countdown: true
      });
    }
  };

  Message.query({ channel: $scope.channel }, function (messages) {
    $scope.messages = $scope.messages.concat(messages);
    $timeout(function () {
      $anchorScroll();
    });
  });

})

// controller for authoring new or existing posts within an event
.controller('PostCtrl', function ($scope, $state, $stateParams, $timeout, Event, Message, socket, parallaxHelper) {
  $scope.channel = $stateParams.channel;
  $scope.messageId = $stateParams.messageId;
  $scope.event = Event.get({ channel: $scope.channel });
  $scope.title = 'New Message';
  $scope.pageClass = 'post';
  $scope.editor = angular.element('#m');
  $scope.typing = false;
  $scope.background = parallaxHelper.createAnimator(-0.3);
  socket.connect($scope.channel);

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
        if($scope.editingMessage && lastEditingTime==$scope.editingMessage.sent) {
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
  }

  $scope.startTyping = function () {
    socket.emit('typing');
    $scope.typing = true;
  };

  $scope.stopTyping = function () {
    socket.emit('stop-typing');
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
})

.config(function ($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/events');
  $stateProvider

    .state('main', {
      url: '/events',
      templateUrl: 'partials/myevents.html',
      controller: 'MyEventsCtrl'
    })

    .state('create', {
      url: '/create',
      templateUrl: 'partials/newevent.html',
      controller: 'CreateEventCtrl'
    })

    .state('event', {
      url: '/events/:channel',
      templateUrl: 'partials/event.html',
      controller: 'EventCtrl'
    })

    .state('post', {
      url: '/events/:channel/post',
      templateUrl: 'partials/postmessage.html',
      controller: 'PostCtrl'
    })

    .state('editPost', {
      url: '/events/:channel/post/:messageId',
      templateUrl: 'partials/postmessage.html',
      controller: 'PostCtrl'
    })

    .state('editEvent', {
      url: '/events/:channel/settings',
      templateUrl: 'partials/eventsettings.html',
      controller: 'EventSettingsCtrl'
    });
});


})(window.angular, window.io, window.jQuery, window.marked);
