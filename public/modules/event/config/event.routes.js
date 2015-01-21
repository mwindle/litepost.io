/*
* Routes for event module
*/
(function () {
	'use strict';

	// Setting up route
	angular.module('event').config(function ($stateProvider) {
	  $stateProvider

	    .state('app.event', {
	      url: '/:username/:slug',
	      templateUrl: 'modules/event/views/event.view.html',
	      controller: 'EventController'
	    })

      .state('app.editEvent', {
        url: '/:username/:slug/settings?s',
        templateUrl: 'modules/event/views/eventsettings.html',
        controller: 'EventSettingsController',
        data: { title: 'Event Settings - LitePost.io' }
      });
	});
})();
