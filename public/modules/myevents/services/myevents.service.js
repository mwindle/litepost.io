'use strict';

angular.module('myevents').factory('Me', function ($resource) {
  return $resource('api/me');
})

.factory('MyEvents', function ($resource) {
  return $resource('api/me/events');
});