/*
* Controllers for the profile module
*/
(function () {
  'use strict';

  angular.module('profile')

  /**
  * Controller to load and expose a user's events
  */
  .controller('ProfileController', function ($scope, $location, $state, $stateParams, User, Event, AuthService, title) {
    $scope.username = $stateParams.username;
    $scope.user = User.get({ username: $scope.username }, function (user) {
      title.set(user.displayName);
    });
    $scope.events = Event.query({ username: $scope.username });

    $scope.logout = function () {
      AuthService.logout();
      $state.go('app.login');
    };

    $scope.getDisplayUrlForEvent = function (event) {
      var relativeUrl = $state.href('app.event', { username: $scope.username, slug: event.slug });
      return $location.host() + relativeUrl;
    };

    $scope.canEditProfile = function () {
      return AuthService.isLoggedIn() && $scope.user && $scope.user.id && 
        AuthService.user().id === $scope.user.id;
    };

  })

  /**
  * Controller to edit current user's profile
  */
  .controller('ProfileSettingsController', function ($scope, $state, $stateParams, $timeout, $window, AuthService, User) {

    $scope.$watch(AuthService.user, function () {
      $scope.me = AuthService.user();
      $scope.updatedMe = angular.copy($scope.me);
    }, true);

    $scope.save = function () {
      $scope.savingProfile = { pending: true };
      $scope.updatedMe.$save(function (me) {
        // Refresh the user details and auth token from the server
        AuthService.login({ refresh: true });
        
        $scope.savingProfile.success = true;
        $scope.savingProfile.pending = false;
        $scope.profile.$setPristine();
        $scope.clearSaving();
      }, function (err) {
        $scope.savingProfile.error = err.data;
        $scope.savingProfile.pending = false;
      });
    };

    $scope.clearSaving = function () {
      $timeout.cancel($scope.clearSavingTimeout);
      $scope.clearSavingTimeout = $timeout(function () {
        $scope.savingProfile = {};
      }, 3000);
    };

    $scope.delete = function () {
      // TODO
      $scope.updatedMe.$delete(function (deleted) {
        AuthService.logout();
        $window.location.href = '/';
      }, function (err) {
        console.log('error');
      });
    };
  })

  /**
  * Controller to create a new account (join) with the service
  */
  .controller('JoinController', function ($scope, $state, User, Token, AuthService) {
    
    $scope.$watch(AuthService.isLoggedIn, function () {
      if(AuthService.isLoggedIn()) {
        $state.go('app.profile', { username: AuthService.user().username });
      }
    });

    $scope.user = new User();

    $scope.create = function () {
      $scope.user.$save(function (result) {
        Token.set(result.token);
        AuthService.login(result.user);
      }, function (err) {
        console.log('failed to join');
      });
    };
    
  })

  /**
  * Controller to create a new event
  */
  .controller('CreateEventController', function ($scope, $state, AuthService, Event) {
    
    // Must be authenticated to create events
    $scope.$watch(AuthService.isLoggedIn, function () {
      if(!AuthService.isLoggedIn()) {
        $state.go('app.login');
      } else {
        $scope.me = AuthService.user();
      }
    });

    $scope.create = function () {
      $scope.creatingEvent = { pending: true };
      new Event({ name: $scope.name }).$save(function (event) {
        $state.go('app.event', { username: AuthService.user().username, slug: event.slug });
      }, function (err) {
        $scope.creatingEvent.pending = false;
        $scope.creatingEvent.error = err.data;
      });
    };

    $scope.cancel = function () {
      $state.go('app.profile', { username: $scope.me.username });
    };

  });

})();
