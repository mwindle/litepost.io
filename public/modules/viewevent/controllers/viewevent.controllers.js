'use strict';

angular.module('viewevent').controller('EventController', 
	function ($scope, $stateParams, $anchorScroll, parallaxHelper, $timeout, Event, Message, socket, title) {
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
    $scope.setPageTitle();
    $scope.updateCountdown();
  });

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
    $scope.setPageTitle();
    $timeout(function () {
      $anchorScroll();
    });
  });

});