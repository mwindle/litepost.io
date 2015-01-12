/*
* Setup routes for myevents
*/
(function () {
  'use strict';

  // Setting up route
  angular.module('myevents').config(function ($stateProvider) {
    $stateProvider

      .state('app.create', {
        url: '/create',
        templateUrl: 'modules/myevents/views/newevent.view.html',
        controller: 'CreateEventController',
        data: { title: 'New Event - LitePost.io' }
      })

      .state('app.profile', {
        url: '/:username',
        templateUrl: 'modules/myevents/views/myevents.view.html',
        controller: 'MyEventsController',
        data: { title: 'Your Events - LitePost.io' }
      });
  });
})();