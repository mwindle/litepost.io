/*
* Routes for viewevent module
*/
(function () {
	'use strict';

	// Setting up route
	angular.module('viewevent').config(function ($stateProvider) {
	  $stateProvider

	    .state('app.event', {
	      url: '/:username/:slug',
	      templateUrl: 'modules/viewevent/views/event.view.html',
	      controller: 'EventController',
	      data: { title: 'Event - LitePost.io' }
	    })

      /** Can remove the extra route below once # is supported in ui.router
      * See: https://github.com/angular-ui/ui-router/issues/701
      */
      .state('app.editEventWithHash', {
        url: '/:username/:slug/settings#:hash',
        templateUrl: 'modules/viewevent/views/eventsettings.html',
        controller: 'EventSettingsController',
        data: { title: 'Event Settings - LitePost.io' }
      })

      .state('app.editEvent', {
        url: '/:username/:slug/settings',
        templateUrl: 'modules/viewevent/views/eventsettings.html',
        controller: 'EventSettingsController',
        data: { title: 'Event Settings - LitePost.io' }
      });
	});
})();
