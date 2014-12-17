/**
* Core services for the application
*/
(function () {
  'use strict';


  angular.module('core')

  /**
  * Event $resource from server REST API. 
  */
  .factory('Event', function ($resource) {
    return $resource('api/events/:id', {id:'@_id'});
  })

  /**
  * Message $resource from server REST API. 
  */
  .factory('Message', function ($resource) {
    return $resource('api/events/:channel/messages/:id', {id:'@_id'});
  })

  /**
  * Service to expose access to title propery on $rootScope
  */
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

  /**
  * Directive that will watch for changes in application state and update the 
  * page title using the title service. 
  * 
  * @example <title />
  */
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

  /**
  * Enables the value of an element to be set with a raw value. 
  * Use of this must be done very carefully to avoid XSS attacks. The value provided
  * must be sanitized beforehand. 
  */
  .filter('unsafe', function ($sce) {
    return function (value) {
      return $sce.trustAsHtml(value);
    };
  })

  /**
  * Watches the html of the directive's element and triggers a parse and compile. 
  * This enables the dynamic html added to an element's value to include additional 
  * directives and other Angular-goodness. 
  * 
  * This was added to this project to enable the parallax scrolling directive to work
  * on the dynamic html of a message. 
  */
  .directive('compileTemplate', function ($compile, $parse) {
    return {
      link: function (scope, element, attr) {
        var parsed = $parse(attr.ngBindHtml);
        function getStringValue() { 
          return (parsed(scope) || '').toString(); 
        }

        //Recompile if the template changes
        scope.$watch(getStringValue, function() {
          //The -9999 makes it skip directives so that we do not recompile ourselves
          $compile(element, null, -9999)(scope);  
        });
      }
    };
  });
})();
