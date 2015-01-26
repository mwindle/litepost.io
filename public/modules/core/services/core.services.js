/**
* Core services for the application
*/
(function () {
  'use strict';


  angular.module('core')

  /*
  * Service to get and set the authentication token for the current user
  * Uses localStorage with fallbacks to cookie, then memory ($rootScope). 
  */
  .factory('Token', function ($rootScope, localStorageService) {
    return {

      set: function (token) {
        $rootScope.token = token;

        // Persist to local storage, which has cookie fallback built in
        if(token) {
          localStorageService.set('token', token);
        } else {
          localStorageService.remove('token');
        }
      },

      get: function (token) {
        return $rootScope.token || localStorageService.get('token');
      }

    };
  })

  /**
  * Service that intercepts server requests to inject authorization header.
  * Also provides redirection services when an authorization failure (401) 
  * is received from the server. 
  * Thanks to https://auth0.com/blog/2014/01/07/angularjs-authentication-with-cookies-vs-token
  * for some of the code below. 
  */
  .factory('AuthTokenInterceptor', function (Token, $injector, $q) {
    return {

      request: function (config) {
        config.headers = config.headers || {};
        var token = Token.get();
        if(token) {
          config.headers.Authorization = 'Bearer ' + token;
        }
        return config;
      },

      responseError: function (response) {
        if(response.status === 401) {
         $injector.get('$state').go('app.login');
        }
        return $q.reject(response);
      }

    };
  })

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
        if (!this.id) {
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
  * Login resource, accepts only POST
  */
  .factory('Login', function (resource) {
    return resource('/api/login');
  })

  /**
  * User $resource from server REST API. 
  */
  .factory('User', function (resource) {
    return resource('/api/users/:id', {id:'@id'});
  })

  /**
  * Event $resource from server REST API. 
  */
  .factory('Event', function (resource) {
    return resource('/api/events/:id', {id:'@id'});
  })

  /**
  * Message $resource from server REST API. 
  */
  .factory('Message', function (resource) {
    return resource('/api/messages/:id', {id:'@id'});
  })

  /**
  * Service for managing currently authenticated user
  */
  .factory('AuthService', function (User, Token, Login) {
    var user = null,
      requestPending = false;
    var service = {

      /**
      * General purpose login function. Called without arguments, will noop if the user is already
      * logged in. If options.refresh is truthy, it will refresh the existing token and user details. 
      * If credentails ( { username, password } ) are provided, any existing token will be cleared and
      * a new login request will be issued against the service. When refresh or credentials are provided
      * options.success and options.failure callbacks will be called if present. 
      */
      login: function (options) {
        options = options || {};
        
        if(requestPending) {
          return;
        }
        // Make a login request to server if the user isn't set, refresh is set, or creds provided
        if(!user || options.refresh || options.credentials) {
          if(options.credentials) {
           // Fresh login when credentials are provided
            service.logout();
          } else if (!Token.get()) {
            // No credentials and no token set, nothing to do here. 
            user = null;
            return;
          }
          var post = options.credentials || {};
          requestPending = !!new Login(post).$save(function (result) {
            Token.set(result.token);
            requestPending = false;
            user = new User(result.user);
            if(options.success && 'function' === typeof options.success) {
              options.success.apply(this, arguments);
            }
          }, function () {
            requestPending = false;
            service.logout();
            if(options.failure && 'function' === typeof options.failure) {
              options.failure.apply(this, arguments);
            }
          });
        }
      },
      logout: function () {
        user = null;
        Token.set();
      },
      isLoggedIn: function () {
        return !!user;
      },
      user: function () {
        return user;
      }
    };
    return service;
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
          if(toState.data && toState.data.title) {
            $timeout(function () {
              title.set(toState.data.title);
            });
          }
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
  })

  /**
  * Strips html tags from provided string. 
  */
  .filter('stripTags', function () {
    return function (value) {
      return value ? value.replace(/<[^>]+>/gm, '') : '';
    };
  })

  /**
  * Returns the number of words in the provided string. 
  */
  .filter('wordCount', function () {
    return function (value) {
      return value ? (value.match(/[\S]+/g) || []).length : 0;
    };
  });

})();
