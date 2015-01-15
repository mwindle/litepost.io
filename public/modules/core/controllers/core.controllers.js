/*
* Controllers for core module
*/
(function () {
  'use strict';

  angular.module('core')

  .controller('CoreController', function ($scope) {
    //TODO: load me (current user)
  })

  .controller('LoginController', function ($scope, Login, Token) {

  	$scope.login = function () {
  		if($scope.username && $scope.password) {
  			new Login({ username: $scope.username, password: $scope.password }).$save(function (token) {
  				Token.set(token.token);
  			});
  		}
  	};

  })

  .controller('IdentityStatusController', function ($scope, Token, Me) {
  	if(Token.get()) {
  		$scope.me = Me.get();
  	}
  });

})();
