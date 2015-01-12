/*
* Controllers for the myevents module
*/
(function () {
  'use strict';

  angular.module('myevents')

  /**
  * Controller to load and expose the users events
  */
  .controller('MyEventsController', function ($scope, $stateParams, User, Event) {
    $scope.username = $stateParams.username;
    $scope.user = User.get({ username: $scope.username });
    $scope.events = Event.query({ username: $scope.username });
  })

  /**
  * Controller to create a new event
  */
  .controller('CreateEventController', function ($scope, $state, Event) {

    $scope.createEvent = function () {
      if($scope.name) {
        new Event({
          name: $scope.name
        }).$save(function (event) {
          $state.go('main');
        });
      }
    };

  });

})();