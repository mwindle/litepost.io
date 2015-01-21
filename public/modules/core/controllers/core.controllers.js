/*
* Controllers for core module
*/
(function () {
  'use strict';

  angular.module('core')

  .controller('CoreController', function (AuthService) {
    AuthService.login();
  })

  .controller('LoginController', function ($scope, $state, $stateParams, AuthService) {

    $scope.username = $stateParams.u || '';

  	$scope.login = function () {
  		if($scope.username && $scope.password) {
        AuthService.authenticate($scope.username, $scope.password, function () {
          $state.go('app.profile', { username: AuthService.user().username });
        }, function (err) {
          console.log('auth failed');
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
