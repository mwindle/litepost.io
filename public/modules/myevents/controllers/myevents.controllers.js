/*
* Controllers for the myevents module
*/
(function () {
  'use strict';

  angular.module('myevents').controller('MyEventsController', function ($scope, Me, MyEvents, Event, Message) {
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

  .controller('CreateEventController', function ($scope, $state, Me, MyEvents, Event, Message) {
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
  .controller('EventSettingsController', function ($scope, $state, $stateParams, Event) {
    $scope.pageClass = 'settings';
    $scope.channel = $stateParams.channel;
    $scope.event = Event.get({ channel: $scope.channel }, function () {
      $scope.updatedEvent = angular.copy($scope.event);
    });

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
        $state.go('main');
      });
    };
  });
})();