/*
* Controllers for core module
*/
(function () {
  'use strict';

  angular.module('core')

  .controller('CoreController', function ($rootScope, Token, Me) {
    
    $rootScope.updateMe = function (me) {
      if(me) {
        $rootScope.me = me;
      } else if(Token.get()) {
        $rootScope.me = Me.get();
      } else {
        $rootScope.me = null;
      }
    };
    $rootScope.updateMe();
  })

  .controller('LoginController', function ($scope, $state, Login, Token, User) {

  	$scope.login = function () {
  		if($scope.username && $scope.password) {
        Token.set();
  			new Login({ username: $scope.username, password: $scope.password }).$save(function (result) {
  				Token.set(result.token);
          $scope.updateMe(new User(result.user));
          $state.go('app.profile', { username: $scope.me.username });
  			});
  		}
  	};

  })

  .controller('IdentityStatusController', function ($scope, Token, Me) {

  });

})();
