'use strict';

// Setting up route
angular.module('core').config(function ($urlRouterProvider) {
  $urlRouterProvider.otherwise('/events');
});