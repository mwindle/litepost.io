/*
* Controllers for core module
*/
(function () {
  'use strict';

  angular.module('core')

  .controller('CoreController', function ($scope, AuthService) {
    AuthService.login();

    /**
    * Users can edit events when they own them. 
    */
    $scope.canEditEvent = function (event) {
      return AuthService.isLoggedIn() && 
        AuthService.user().id && 
        event &&
        event.owner &&
        AuthService.user().id === event.owner;
    };

    /**
    * Users can edit messages they are the author of. 
    */
    $scope.canEditMessage = function (message) { 
      return AuthService.isLoggedIn() && 
        AuthService.user().id && 
        message &&
        message.author &&
        ( AuthService.user().id === message.author || AuthService.user().id === message.author.id );
    };
  })

  .controller('LoginController', function ($scope, $state, $stateParams, AuthService) {

    $scope.username = $stateParams.u || '';

  	$scope.login = function () {
  		if($scope.username && $scope.password) {
        AuthService.login({
          credentials: {
            username: $scope.username,
            password: $scope.password
          },
          success: function () {
            $state.go('app.profile', { username: AuthService.user().username });
          },
          failure: function () {
            // TODO
            console.log('auth failed');
          }
        });
  		}
  	};

  })

  .controller('IdentityStatusController', function ($scope, AuthService) {
    AuthService.login();
    $scope.$watch(AuthService.user, function () {
      $scope.me = AuthService.user();
    });
  });

})();
