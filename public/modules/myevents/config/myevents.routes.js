'use strict';

// Setting up route
angular.module('myevents').config(function ($stateProvider) {
  $stateProvider

    .state('main', {
      url: '/events',
      templateUrl: 'modules/myevents/views/myevents.view.html',
      controller: 'MyEventsController',
      data: { title: 'Your Events - LitePost.io' }
    })

    .state('create', {
      url: '/create',
      templateUrl: 'modules/myevents/views/newevent.view.html',
      controller: 'CreateEventController',
      data: { title: 'New Event - LitePost.io' }
    })

    .state('editEvent', {
      url: '/events/:channel/settings',
      templateUrl: 'modules/myevents/views/eventsettings.html',
      controller: 'EventSettingsController',
      data: { title: 'Event Settings - LitePost.io' }
    });
});