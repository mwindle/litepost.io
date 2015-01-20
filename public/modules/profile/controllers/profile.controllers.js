/*
* Controllers for the profile module
*/
(function () {
  'use strict';

  angular.module('profile')

  /**
  * Controller to load and expose the users events
  */
  .controller('MyEventsController', function ($scope, $location, $state, $stateParams, User, Event, Token) {
    $scope.username = $stateParams.username;
    $scope.user = User.get({ username: $scope.username });
    $scope.events = Event.query({ username: $scope.username });

    $scope.logout = function () {
      Token.set();
      $scope.updateMe();
      $state.go('app.login');
    };

    $scope.getDisplayUrlForEvent = function (event) {
      return $location.host() + '/app/' + $scope.username + '/' + event.slug;
    };

    $scope.canEditProfile = function () {
      return $scope.me && $scope.user && $scope.me._id && $scope.user._id && $scope.me._id === $scope.user._id;
    };

  })

  /**
  * Controller to edit current user's profile
  */
  .controller('ProfileSettingsController', function ($scope, $stateParams, Me, User) {
    
    $scope.$watch('me.$resolved', function () {
      if($scope.me.$resolved) {
        $scope.updatedMe = new User(angular.copy($scope.me));
      }
    });

    $scope.save = function () {
      $scope.updatedMe.$save(function (me) {
        $scope.updateMe(me);
      });
    };
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
          $state.go('app');
        });
      }
    };

  });

})();