/**
* Unit tests for the core application controllers
*/
(function () {
	'use strict';


	describe('core controllers', function () {

		// Load the main application module from the global app config
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		beforeEach(module('stateMock'));

		describe('CoreController', function () {
			var AuthService, createController;

			// Setup injected services
			beforeEach(inject(function ($injector) {
				AuthService = $injector.get('AuthService');
				var $controller = $injector.get('$controller');
				
				createController = function () {
					return $controller('CoreController', {
						$scope: $injector.get('$rootScope')
					});
				};
			}));

			it('should call login without refreshing', function () {
				spyOn(AuthService, 'login');
				createController();
				expect(AuthService.login).toHaveBeenCalledWith();
			});

		});

		describe('LoginController', function () {
			var $scope, $state, $stateParams, AuthService, createController;

			// Setup injected services
			beforeEach(inject(function ($injector) {
				$scope = $injector.get('$rootScope');
				$state = $injector.get('$state');
				$stateParams = $injector.get('$stateParams');
				AuthService = $injector.get('AuthService');
				var $controller = $injector.get('$controller');
				
				createController = function () {
					return $controller('LoginController', {
						$scope: $scope
					});
				};
			}));

			it('should use AuthService to login and change state when successful', function () {
				createController();
				$scope.username = 'something';
				$scope.password = 'somethingelse';
				AuthService.login = function (options) {
					expect(options.credentials.username).toEqual($scope.username);
					expect(options.credentials.password).toEqual($scope.password);
					spyOn(AuthService, 'user').and.returnValue({ username: $scope.username });
					spyOn($state, 'go');
					options.success();
					expect($state.go).toHaveBeenCalled();
				};
				$scope.login();
			});

			it('should not login if username and password aren\'t both set', function () {
				createController();
				spyOn(AuthService, 'login');
				$scope.username = 'something';
				$scope.login();
				expect(AuthService.login).not.toHaveBeenCalled();
			});

			it('should preload username from state', function () {
				$stateParams.u = 'bob';
				createController();
				expect($scope.username).toEqual('bob');
			});

		});		

		describe('IdentityStatusController', function () {
			var $scope, AuthService, createController;

			// Setup injected services
			beforeEach(inject(function ($injector) {
				$scope = $injector.get('$rootScope');
				AuthService = $injector.get('AuthService');
				var $controller = $injector.get('$controller');
				
				createController = function () {
					return $controller('IdentityStatusController', {
						$scope: $scope
					});
				};
			}));

			it('should call login without refreshing', function () {
				spyOn(AuthService, 'login');
				createController();
				expect(AuthService.login).toHaveBeenCalledWith();
			});

			it('should update it\'s current user copy when the current user changes', function () {
				spyOn(AuthService, 'login');
				var u = 'something';
				AuthService.user = function () {
					return u;
				};
				createController();
				$scope.$digest();
				expect($scope.me).toEqual(u);
				u = 'something else';
				$scope.$digest();
				expect($scope.me).toEqual(u);
			});

		});
		
	});

})();
