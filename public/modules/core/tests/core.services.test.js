/**
* Unit tests for the core application services
*/
(function () {
	'use strict';

	describe('core services', function () {

		// Load the main application module from the global app config
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

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
		
	});

})();
