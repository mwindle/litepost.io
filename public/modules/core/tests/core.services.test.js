/**
* Unit tests for the core application services
*/
(function () {
	'use strict';


	describe('core services', function () {

		// Load the main application module from the global app config
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		beforeEach(module('stateMock'));

		describe('Token service', function () {
			var $rootScope, Token, localStorageService;

			// Setup injected services
			beforeEach(inject(function ($injector) {
				$rootScope = $injector.get('$rootScope');
				Token = $injector.get('Token');
				localStorageService = $injector.get('localStorageService');
				spyOn(localStorageService, 'get');
				spyOn(localStorageService, 'set');
				spyOn(localStorageService, 'remove');
			}));

			it('set should set token in localStorageService', function () {
				var token = 'token';
				Token.set(token);
				expect(localStorageService.set).toHaveBeenCalledWith('token', token);
			});

			it('get should get token from localStorageService when it\'s not been set yet', function () {
				Token.get();
				expect(localStorageService.get).toHaveBeenCalledWith('token');
			});

			it('get should get token from memory if it\'s already been set', function () {
				var token = 'token';
				Token.set(token);
				Token.get();
				expect(localStorageService.get).not.toHaveBeenCalled();
			});

			it('should remove a token when set is called with nothing', function () {
				var token = 'token';
				Token.set(token);
				Token.set();
				token = Token.get();
				expect(token).toBe(undefined);
			});

		});

		describe('AuthTokenInterceptor service', function () {
			var $http, $httpBackend, Token, $state, AuthTokenInterceptor, token = 'token';

			// Setup injected services
			beforeEach(inject(function ($injector) {
				$http = $injector.get('$http');
				$httpBackend = $injector.get('$httpBackend');
				Token = $injector.get('Token');
				AuthTokenInterceptor = $injector.get('AuthTokenInterceptor');
				$state = $injector.get('$state');
			}));

			it('should set an authorization header when a token exists', function () {
				spyOn(Token, 'get').and.returnValue(token);
				$httpBackend.expectGET('/api', function (headers) {
					expect(headers.Authorization).toBe('Bearer ' + token);
					return true;
				}).respond(200);
				$http.get('/api');
				$httpBackend.flush();
			});

			it('should not set an authorization header when no token exists', function () {
				spyOn(Token, 'get').and.returnValue();
				$httpBackend.expectGET('/api', function (headers) {
					expect(headers.Authorization).toBe(undefined);
					return true;
				}).respond(200);
				$http.get('/api');
				$httpBackend.flush();
			});

			it('should redirect on 401 response', function () {
				spyOn($state, 'go');
				$httpBackend.expectGET('/api').respond(401);
				$http.get('/api');
				$httpBackend.flush();
				expect($state.go).toHaveBeenCalled();
			});

		});

		describe('AuthService service', function () {
			var $rootScope, $httpBackend, User, Token, Login, AuthService, token, user;

			// Setup injected services
			beforeEach(inject(function ($injector) {
				$rootScope = $injector.get('$rootScope');
				$httpBackend = $injector.get('$httpBackend');
				User = $injector.get('User');
				Token = $injector.get('Token');
				Login = $injector.get('Login');
				AuthService = $injector.get('AuthService');
			}));

			// Setup some mock values
			beforeEach(function () {
				token = 'super.cool.token';
				user = {
					id: '1234',
					name: 'Bob',
					username: 'bob'
				};
			});

			afterEach(function() {
				$httpBackend.verifyNoOutstandingExpectation();
				$httpBackend.verifyNoOutstandingRequest();
			});

			it('should post to service on first call with token set', function () {
				spyOn(Token, 'get').and.returnValue('old token');
				$httpBackend.expectPOST('/api/login').respond(200, { token: token, user: user });
				AuthService.login();
				$httpBackend.flush();
			});

			it('should not post to service if token not set', function () {
				spyOn(Token, 'get').and.returnValue();
				AuthService.login();
				$rootScope.$digest(); // Needed to verify no requests have been made

				AuthService.login({ refresh: true });
				$rootScope.$digest(); 
			});

			it('should not post to service if another request is pending', function () {
				spyOn(Token, 'get').and.returnValue('old token');
				$httpBackend.expectPOST('/api/login').respond(200, { token: token, user: user });
				AuthService.login();
				AuthService.login();
				$httpBackend.flush();
			});

			it('should refresh from service when refresh option provided', function () {
				spyOn(Token, 'get').and.returnValue('old token');
				$httpBackend.expectPOST('/api/login').respond(200, { token: 'different', user: user });
				AuthService.login();
				$httpBackend.flush();

				$httpBackend.expectPOST('/api/login').respond(200, { token: token, user: user });
				AuthService.login({ refresh: true });
				$httpBackend.flush();
				expect(AuthService.user()).toEqualData(user);
			});

			it('should authenticate against service when credentials are provided', function () {
				spyOn(Token, 'get').and.returnValue('old token');
				$httpBackend.expectPOST('/api/login').respond(200, { token: token, user: user });
				AuthService.login({ credentials: { username: 'bob', password: 'whatever' }});
				$httpBackend.flush();
				expect(AuthService.user()).toEqualData(user);
			});

			it('should call success callback when provided', function () {
				var o = { cb: function () {} };
				spyOn(o, 'cb');
				spyOn(Token, 'get').and.returnValue('old token');
				$httpBackend.expectPOST('/api/login').respond(200, { token: token, user: user });
				AuthService.login({ success: o.cb });
				$httpBackend.flush();
				expect(o.cb).toHaveBeenCalled();
			});

			it('should call failure callback when provided', function () {
				var o = { cb: function () {} };
				spyOn(o, 'cb');
				spyOn(Token, 'get').and.returnValue('old token');
				$httpBackend.expectPOST('/api/login').respond(403);
				AuthService.login({ failure: o.cb });
				$httpBackend.flush();
				expect(o.cb).toHaveBeenCalled();
			});

		});

		describe('pageClass service', function () {
			var $rootScope, pageClass;

			// Setup injected services
			beforeEach(inject(function ($injector) {
				$rootScope = $injector.get('$rootScope');
				pageClass = $injector.get('pageClass');
			}));

			// Setup $rootScope.pageClass with default value
			beforeEach(function () {
				$rootScope.pageClass = 'default';
			});

			it('get method should get pageClass from $rootScope', function () {
				expect(pageClass.get()).toEqual($rootScope.pageClass);
			});

			it('set method should set pageClass on $rootScope', function () {
				pageClass.set('testing');
				expect($rootScope.pageClass).toEqual('testing');
			});

		});

		describe('title service', function () {
			var $rootScope, title;

			// Setup injected services
			beforeEach(inject(function ($injector) {
				$rootScope = $injector.get('$rootScope');
				title = $injector.get('title');
			}));

			// Setup $rootScope.title with default
			beforeEach(function () {
				$rootScope.title = 'default';
			});

			it('get method should get title from $rootScope', function () {
				expect(title.get()).toEqual($rootScope.title);
			});

			it('set method should set title on $rootScope', function () {
				title.set('testing');
				expect($rootScope.title).toEqual('testing');
			});
		});

		describe('title directive', function () {
			var $rootScope, $compile, $timeout, title;

			// Setup title service mock
			beforeEach(function () {
					title = {};
					title.set = function () {};
				  module(function ($provide) {
				    $provide.value('title', title);
				  });
			});

			// Setup injected services
			beforeEach(inject(function ($injector) {
				$rootScope = $injector.get('$rootScope');
				$compile = $injector.get('$compile');
				$timeout = $injector.get('$timeout');
			}));

			it('calls set method on title service when a state change succeeds', function () {
				// Compile a piece of HTML containing the directive
		    var element = $compile('<title />')($rootScope);
		    spyOn(title, 'set');
		    // Send out a synthetic state change event with a new title
		    $rootScope.$broadcast('$stateChangeSuccess', {data: {title: 'updated'}});
		    $timeout.flush();
		    expect(title.set).toHaveBeenCalledWith('updated');
			});
		});

		describe('unsafe filter', function () {
			var $filter, unsafe;

			// Setup injected services
			beforeEach(inject(function ($injector) {
				$filter = $injector.get('$filter');
			}));

			beforeEach(function () {
				unsafe = $filter('unsafe');
			});

			it('returns a simple string with no markup', function () {
				var str = 'A simple string with no markup';
				expect(unsafe(str).$$unwrapTrustedValue()).toEqual(str);
			});

			it('returns a simple string with safe markup', function () {
				var str = '<b>A simple string with no markup</b>';
				expect(unsafe(str).$$unwrapTrustedValue()).toEqual(str);
			});

			it('returns a simple string with unsafe markup', function () {
				var str = '<a href="javascript://unsafe.js">A simple string with no markup</a>';
				expect(unsafe(str).$$unwrapTrustedValue()).toEqual(str);
			});
		});

		describe('stripTags filter', function () {
			var $filter, stripTags;

			// Setup injected services
			beforeEach(inject(function ($injector) {
				$filter = $injector.get('$filter');
			}));

			beforeEach(function () {
				stripTags = $filter('stripTags');
			});

			it('strips tags from basic html', function () {
				var str = '<a href="http://litepost.io">Test</a>';
				expect(stripTags(str)).toEqual('Test');
			});

			it('strips tags from more interesting html', function () {
				var str = '<!-- comment --><li><a href="http://litepost.io" \n\n ng-bind="&gt;&lt;whatever">Test</a>';
				expect(stripTags(str)).toEqual('Test');
			});

			it('leave untagged string intact', function () {
				var str = 'Testing';
				expect(stripTags(str)).toEqual(str);
			});

		});

		describe('wordCount filter', function () {
			var $filter, wordCount;

			// Setup injected services
			beforeEach(inject(function ($injector) {
				$filter = $injector.get('$filter');
			}));

			beforeEach(function () {
				wordCount = $filter('wordCount');
			});

			it('count 0 when empty', function () {
				var str = '';
				expect(wordCount(str)).toEqual(0);
			});

			it('count 0 when no words with spaces and tabs', function () {
				var str = '  			 ';
				expect(wordCount(str)).toEqual(0);
			});

			it('count 1 when 1 word', function () {
				var str = 'one';
				expect(wordCount(str)).toEqual(1);
			});

			it('count 3 when 3 words with extra spaces', function () {
				var str = '    one  	  two  	   three ';
				expect(wordCount(str)).toEqual(3);
			});

			it('count 1 with contraction', function () {
				var str = 'it\'s';
				expect(wordCount(str)).toEqual(1);
			});

		});
		
	});

})();
