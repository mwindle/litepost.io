'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	// Init module configuration options
	var applicationModuleName = 'liveBlogApp';
	var applicationModuleVendorDependencies = [
	  'ui.router', 
	  'btford.socket-io',
	  'mgcrea.ngStrap',
	  'duParallax',
	  'ngResource', 
	  'LocalStorageModule',
	  'ngAnimate',
	  'ngSanitize', 
	  'angularMoment',
	  'angular-inview',
	  'duScroll'
	];

	// Add a new vertical module
	var registerModule = function(moduleName, dependencies) {
		// Create angular module
		angular.module(moduleName, dependencies || []);

		// Add the module to the AngularJS configuration file
		angular.module(applicationModuleName).requires.push(moduleName);
	};

	return {
		applicationModuleName: applicationModuleName,
		applicationModuleVendorDependencies: applicationModuleVendorDependencies,
		registerModule: registerModule
	};
})();