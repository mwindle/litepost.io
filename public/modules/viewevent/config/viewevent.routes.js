/*
* Routes for viewevent module
*/
(function () {
	'use strict';

	// Setting up route
	angular.module('viewevent').config(function ($stateProvider) {
	  $stateProvider

	    .state('event', {
	      url: '/events/:channel',
	      templateUrl: 'modules/viewevent/views/event.view.html',
	      controller: 'EventController',
	      data: { title: 'Event - LitePost.io' }
	    });
	});
})();