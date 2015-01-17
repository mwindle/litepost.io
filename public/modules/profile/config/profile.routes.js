/*
* Setup routes for profile
*/
(function () {
  'use strict';

  // Setting up route
  angular.module('profile').config(function ($stateProvider) {
    $stateProvider

      .state('app.create', {
        url: '/create',
        templateUrl: 'modules/profile/views/newevent.view.html',
        controller: 'CreateEventController',
        data: { title: 'New Event - LitePost.io' }
      })

      .state('app.editProfile', {
        url: '/settings',
        templateUrl: 'modules/profile/views/settings.view.html',
        controller: 'ProfileSettingsController',
        data: { title: 'Edit Profile - LitePost.io' }
      })

      .state('app.profile', {
        url: '/:username',
        templateUrl: 'modules/profile/views/profile.view.html',
        controller: 'MyEventsController',
        data: { title: 'Your Events - LitePost.io' }
      });
      
  });
})();
