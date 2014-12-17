/**
* Unit tests for the myevents controllers 
*/
(function () {
	'use strict';

	describe('myevents controllers', function () {

		var $httpBackend, $scope, $controller, createController, mocks;

		// Load the main application module from the global app config
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		// Setup data-only equals comparison to ignore injected $resource methods when comparing
		// mocked objects
		beforeEach(function() {
			jasmine.addMatchers({
				toEqualData: function(util, customEqualityTesters) {
					return {
						compare: function(actual, expected) {
							return {
								pass: angular.equals(actual, expected)
							};
						}
					};
				}
			});
		});

		// Setup injected services
		beforeEach(inject(function ($injector) {
			$httpBackend = $injector.get('$httpBackend');
			$scope = $injector.get('$rootScope');
			$controller = $injector.get('$controller');
		}));

		// Setup mock objects
		beforeEach(function () {
			mocks = {};
			// Mocked Me object
			mocks.me = {
				_id: '1111',
				email: 'me@example.com'
			};

			// Mocked Event object array
			mocks.me.events = [
				{
					_id: '123456789', 
					name: 'Mocked Event One',
					channel: 'mocked-event-one',
					start: new Date(),
					hidden: false,
					users: [{
						user: '1111',
						role: 'creator',
						_id: 'no matter'
					}]
				},
				{
					_id: '9876', 
					name: 'Mocked Event Two',
					channel: 'mocked-event-two',
					start: new Date(),
					hidden: false,
					users: [{
						user: '2222',
						role: 'creator',
						_id: 'no matter'
					}]
				},
				{
					_id: '5432', 
					name: 'Mocked Event Three',
					channel: 'mocked-event-three',
					start: new Date(),
					hidden: false,
					users: [{
						user: '3333',
						role: 'creator',
						_id: 'no matter'
					}]
				}
			];

			// Mock a new Event object
			mocks.newEvent = {
				_id: 'new-event-id', 
				name: 'New Event',
				channel: 'new-event',
				start: new Date(),
				hidden: false,
				users: [{
					user: '2222',
					role: 'creator',
					_id: 'no matter'
				}]
			};

		});

		// Setup request handlers
		beforeEach(function () {
			mocks.meGetRequest = 'api/me';
			$httpBackend.when('GET', mocks.meGetRequest).respond(mocks.me);

			mocks.myEventsGetRequest = 'api/me/events';
			$httpBackend.when('GET', mocks.myEventsGetRequest).respond(mocks.me.events);

			mocks.eventPostRequest = 'api/events';
			$httpBackend.when('POST', mocks.eventPostRequest).respond(mocks.newEvent);
		});

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		describe('MyEventsController', function () {

			// Expose method to create a controller
			beforeEach(function () {
				createController = function () {
					return $controller('MyEventsController', {
						$scope: $scope
					});
				};
			});

			it('should get the logged in user and their events', function () {
				$httpBackend.expectGET(mocks.meGetRequest);
				$httpBackend.expectGET(mocks.myEventsGetRequest);
				var controller = createController();
				$httpBackend.flush();
				expect($scope.user).toEqualData(mocks.me);
			});

		});

		describe('CreateEventController', function () {
			var $state;

			// Setup $state mock
			beforeEach(function () {
				$state = {
					go: function () {}
				};
			});

			// Expose method to create a controller
			beforeEach(function () {
				createController = function () {
					return $controller('CreateEventController', {
						$scope: $scope,
						$state: $state
					});
				};
			});

			it('createEvent method should put the new event on the server', function () {
				var controller = createController();
				$scope.channel = mocks.newEvent.channel;
				$scope.name = mocks.newEvent.name;
				$scope.createEvent();
				$httpBackend.expectPOST(mocks.eventPostRequest);
				$httpBackend.flush();
			});

			it('createEvent method should change state on success', function () {
				var controller = createController();
				$scope.channel = mocks.newEvent.channel;
				$scope.name = mocks.newEvent.name;
				spyOn($state, 'go');
				$scope.createEvent();
				$httpBackend.flush();
				expect($state.go).toHaveBeenCalled();
			});

			it('createEvent method should not create an event if channel or name is empty', function () {
				var controller = createController();
				$scope.createEvent();
			});
		});

	});

})();
