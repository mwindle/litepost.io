/*
* Setup default route for entire application
*/
(function () {
'use strict';

	// Setting up route
	angular.module('core').config(function ($urlRouterProvider) {
	  $urlRouterProvider.otherwise('/events');
	});

})();