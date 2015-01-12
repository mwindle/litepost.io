/*
* Setup default route for entire application
*/
(function () {
'use strict';

	// Setting up route
	angular.module('core').config(function ($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider) {
	   $stateProvider.state('app', {
      url: '',
      template: '<ui-view />',
      controller: 'CoreController'
    });

	  $urlRouterProvider.otherwise('/events');
	  $urlMatcherFactoryProvider.strictMode(false);
	});

})();