/*
* Core services for the application
*/
(function () {
  'use strict';

  angular.module('core').factory('Event', function ($resource) {
    return $resource('api/events/:id', {id:'@_id'});
  })

  .factory('Message', function ($resource) {
    return $resource('api/events/:channel/messages/:id', {id:'@_id'});
  })

  .factory('title', function ($rootScope) { 
    return {
      set: function (title) {
        $rootScope.title = title;
      },
      get: function () {
        return $rootScope.title;
      }
    };
  })

  .directive('title', function ($rootScope, $timeout, title) {
    return {
      restrict: 'E',
      link: function () {
        $rootScope.$on('$stateChangeSuccess', function (event, toState) {
          $timeout(function () {
            title.set(toState.data.title);
          });
        });
      }
    };
  })

  .filter('unsafe', function ($sce) {
    return function (value) {
      return $sce.trustAsHtml(value);
    };
  })

  .directive('compileTemplate', function ($compile, $parse) {
    return {
      link: function (scope, element, attr) {
        var parsed = $parse(attr.ngBindHtml);
        function getStringValue() { return (parsed(scope) || '').toString(); }

        //Recompile if the template changes
        scope.$watch(getStringValue, function() {
          //The -9999 makes it skip directives so that we do not recompile ourselves
          $compile(element, null, -9999)(scope);  
        });
      }
    };
  });
})();
