/**
* Unit tests for the EventSocket service 
*/
(function () {
	'use strict';

	// Load the main application module from the global app config
	beforeEach(module(ApplicationConfiguration.applicationModuleName));

	describe('EventSocket service', function () {
		var $rootScope, service, mocks;

		// Setup mocked connection instance
		beforeEach(function () {
			mocks = {};
			mocks.socket = createMockSocketObject();
			mocks.socket.connected = true;
			io.connect = function () {
				return mocks.socket;
			};
		});

		// Setup injected services
		beforeEach(inject(function ($injector) {
			$rootScope = $injector.get('$rootScope');
			service = $injector.get('EventSocket');
		}));

		describe('connect method', function () {

			it('should fail to connect if no room is provided', function () {
				expect(service.connect()).toBe(false);
			});

			it('should invoke io.connect() function', function () {
				spyOn(io, 'connect');
				service.connect('test');
				expect(io.connect).toHaveBeenCalled();
			});

			it('should return false if io.connect() fails', function () {
				spyOn(io, 'connect').and.returnValue(false);
				expect(service.connect('test')).toBe(false);
			});

			it('should join the provided room', function () {
				spyOn(mocks.socket, 'emit');
				service.connect('test');
				expect(mocks.socket.emit).toHaveBeenCalledWith('join', 'test');
			});

			it('should listen to connect events', function () {
				spyOn(mocks.socket, 'on');
				service.connect('test');
				expect(mocks.socket.on).toHaveBeenCalledWith('connect', jasmine.any(Function));
			});

		});

		describe('disconnect method', function () {

			it('should return false if not yet connected', function () {
				expect(service.disconnect()).toBe(false);
			});

			it('should leave the provided room', function () {
				service.connect('test');
				spyOn(mocks.socket, 'emit');
				service.disconnect();
				expect(mocks.socket.emit).toHaveBeenCalledWith('leave', 'test');
			});

			it('should clear the room and service parameters', function () {
				service.connect('test');
				service.disconnect();
				expect(service.room).toBe(null);
				expect(service.socket).toBe(null);
			});

		});

		describe('on method', function () {

			it('should return false if not yet connected', function () {
				expect(service.on('whatever', function () {})).toBe(false);
			});

			it('should invoke the actual socket handler on method', function () {
				service.connect('test');
				spyOn(mocks.socket, 'on');
				service.on('whatever', function () {});
				expect(mocks.socket.on).toHaveBeenCalledWith('whatever', jasmine.any(Function));
			});

		});

		describe('emit method', function () {

			it('should return false if not yet connected', function () {
				expect(service.emit('whatever', {test: true}, function () {})).toBe(false);
			});

			it('should invoke the actual socket handler emit method', function () {
				service.connect('test');
				spyOn(mocks.socket, 'emit');
				service.emit('whatever', {test: true}, function () {});
				expect(mocks.socket.emit).toHaveBeenCalledWith('whatever', {test: true}, jasmine.any(Function));
			});

		});

	});

	describe('slug directive', function() {
	  var $scope, form;

	  beforeEach(inject(function($compile, $rootScope) {
	    $scope = $rootScope;
	    var element = angular.element(
	      '<form name="form">' +
	        '<input ng-model="model.slug" name="slug" slug />' +
	      '</form>'
	    );
	    $scope.model = { slug: null };
	    $compile(element)($scope);
	    $scope.$digest();
	    form = $scope.form;
	  }));

    it('should pass with all lowercase letters', function() {
      form.slug.$setViewValue('something');
      expect($scope.model.slug).toEqual('something');
      expect(form.slug.$valid).toBe(true);
    });

    it('should not pass with invalid characters', function() {
      form.slug.$setViewValue('**invalid**');
      expect($scope.model.slug).toBeUndefined();
      expect(form.slug.$valid).toBe(false);
    });

	});

})();
