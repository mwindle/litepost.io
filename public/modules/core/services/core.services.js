/**
* Core services for the application
*/
(function () {
  'use strict';


  angular.module('core')

  /**
  * Extend $resource to ensure update uses PUT
  * Thanks to http://kirkbushell.me/angular-js-using-ng-resource-in-a-more-restful-manner/
  */
  .factory('resource', function ($resource) {
    return function (url, params, methods) {
      var defaults = {
        update: { method: 'put', isArray: false },
        create: { method: 'post' }
      };

      methods = angular.extend(defaults, methods);

      var resource = $resource(url, params, methods);

      resource.prototype.$save = function () {
        if (!this._id) {
          return this.$create.apply(this, arguments);
        }
        else {
          return this.$update.apply(this, arguments);
        }
      };
      return resource;
    };
  })

  /**
  * User $resource from server REST API. 
  */
  .factory('User', function (resource) {
    return resource('api/users/:id', {id:'@_id'});
  })

  /**
  * Event $resource from server REST API. 
  */
  .factory('Event', function (resource) {
    return resource('api/events/:id', {id:'@_id'});
  })

  /**
  * Message $resource from server REST API. 
  */
  .factory('Message', function (resource) {
    return resource('api/messages/:id', {id:'@_id'});
  })

  /**
  * Service to expose access to pageClass property on $rootScope
  */
  .factory('pageClass', function ($rootScope) {
    return {
      set: function (pageClass) {
        $rootScope.pageClass = pageClass;
      },
      get: function () {
        return $rootScope.pageClass;
      }
    };
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
