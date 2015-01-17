/*
* Setup default route for entire application
*/
(function () {
'use strict';

	
	angular.module('core')

	// Ensure all http requests include Authorization header if a token is set
	.config(function ($httpProvider) {
		$httpProvider.interceptors.push('AuthTokenInterceptor');
	})

	.config(function ($locationProvider, $stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider) {
	   $stateProvider

		   .state('app', {
	      url: '',
	      template: '<ui-view />',
	      controller: 'CoreController'
	    })

		   .state('app.login', {
		   		url: '/login',
		   		templateUrl: 'modules/core/views/login.view.html',
		   		controller: 'LoginController',
		   		data: { title: 'Login - LitePost.io' }
		   });

	  $urlRouterProvider.otherwise('/events');
	  $urlMatcherFactoryProvider.strictMode(false);
	  $locationProvider.html5Mode(true).hashPrefix('!');
	});

})();
