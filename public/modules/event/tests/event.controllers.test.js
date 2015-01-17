/**
* Unit tests for the EventController 
*/
(function () {
	'use strict';


	describe('EventController', function () {
		var $httpBackend, $scope, $controller, createController, mocks = {}, EventSocket;

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

		// Load the main application module from the global app config
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		// Setup injected services
		beforeEach(inject(function ($injector) {
			$httpBackend = $injector.get('$httpBackend');
			$scope = $injector.get('$rootScope');
			$controller = $injector.get('$controller');
		}));

		// Expose method to create a controller
		beforeEach(function () {
			createController = function () {
				return $controller('EventController', {
					$scope: $scope,
					$stateParams: {
						channel: mocks.event.channel
					},
					EventSocket: EventSocket
				});
			};
		});

		// Setup socket service mock
		beforeEach(function () {
			EventSocket = {};
			EventSocket.connect = function (channel) {};
			EventSocket.disconnect = function () {};
			EventSocket.handlers = {};

			// Setup event handlers, deliberately not doing any scope binding to ensure
			// the controller doesn't rely on it. 
			EventSocket.on = function (event, callback) {
				if(!EventSocket[event]) {
					EventSocket[event] = [];
				}
				EventSocket[event].push(callback);
			};
			EventSocket.emit = function (event, message) {
				if(EventSocket[event]) {
					EventSocket[event].forEach(function(callback) {
						callback.call(this, message);
					});
				}
			};
		});

		// Setup mock objects
		beforeEach(function () {		
			// Mocked Event object
			mocks.event = {
				_id: '123456789', 
				name: 'Mocked Event',
				channel: 'mocked-event',
				start: new Date(),
				hidden: false,
				users: [{
					user: '1111',
					role: 'creator',
					_id: 'no matter'
				}]
			};

			// Mocked Message object array
			mocks.messages = [
				{
					_id: 'id-one',
					channel: mocks.event.channel,
					text: 'Hello World!',
					html: '<p>Hello World!</p>',
					sent: new Date()
				},
				{
					_id: 'id-two',
					channel: mocks.event.channel,
					text: 'Hello Again World!',
					html: '<p>Hello Again World!</p>',
					sent: new Date()					
				}
			];

			// Mock a new Message object
			mocks.newMessage = {
				_id: 'new-id',
				channel: mocks.event.channel,
				text: 'New Message!',
				html: '<p>New Message!</p>',
				sent: new Date()
			};

		});

		// Setup request handlers
		beforeEach(function () {
			mocks.eventGetRequest = 'api/events?channel=' + mocks.event.channel;
			$httpBackend.when('GET', mocks.eventGetRequest).respond(mocks.event);

			mocks.messagesGetRequest = 'api/events/' + mocks.event.channel + '/messages';
			$httpBackend.when('GET', mocks.messagesGetRequest).respond(mocks.messages);
		});

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		it('should get the event and its messages from the service', function () {
			$httpBackend.expectGET(mocks.eventGetRequest);
			$httpBackend.expectGET(mocks.messagesGetRequest);
			var controller = createController();
			$httpBackend.flush();
			expect($scope.event).toEqualData(mocks.event);
			expect($scope.messages).toEqualData(mocks.messages);
		});

		it('should tolerate no event from the service', function () {
			$httpBackend.expectGET(mocks.eventGetRequest).respond();
			$httpBackend.expectGET(mocks.messagesGetRequest).respond();
			var controller = createController();
			$httpBackend.flush();
			expect($scope.event).toEqualData({});	
			expect($scope.messages).toEqualData([]);		
		});

		it('should connect to the EventSocket on the event channel', function () {
			spyOn(EventSocket, 'connect');
			var controller = createController();
			$httpBackend.flush();
			expect(EventSocket.connect).toHaveBeenCalledWith(mocks.event.channel);
		});

		it('should disconnect from the EventSocket when its scope is destroyed', function () {
			var controller = createController();
			$httpBackend.flush();
			spyOn(EventSocket, 'disconnect');
			$scope.$destroy();
			expect(EventSocket.disconnect).toHaveBeenCalled();
		});

		it('should default to not be in the typing state', function () {
			var controller = createController();
			$httpBackend.flush();
			expect($scope.typing).toBeFalsy();
		});

		it('should enter typing state when EventSocket typing event is fired', function () {
			var controller = createController();
			$httpBackend.flush();
			EventSocket.emit('typing');
			expect($scope.typing).toBe(true);
		});

		it('should leave typing state when EventSocket stop-typing event is fired', function () {
			var controller = createController();
			$httpBackend.flush();
			EventSocket.emit('typing');
			EventSocket.emit('stop-typing');
			expect($scope.typing).toBeFalsy();
		});

		it('should prepend new messages when EventSocket sends them', function () {
			var controller = createController();
			$httpBackend.flush();
			EventSocket.emit('new-message', mocks.newMessage);
			expect($scope.messages[0]).toEqualData(mocks.newMessage);
		});

		it('should remove messages when EventSocket sends delete-message', function () {
			var controller = createController();
			$httpBackend.flush();
			EventSocket.emit('delete-message', mocks.messages[0]);
			expect($scope.messages.length).toEqual(mocks.messages.length - 1);	
		});

		it('should update messages when EventSocket sends update-message', function () {
			var controller = createController();
			$httpBackend.flush();
			mocks.messages[0].text = 'Updated!';
			EventSocket.emit('update-message', mocks.messages[0]);
			expect($scope.messages[0]).toEqualData(mocks.messages[0]);	
		});

		it('should update event viewer count when EventSocket sends event-meta-update', function () {
			var controller = createController();
			$httpBackend.flush();
			EventSocket.emit('event-meta-update', { viewers: 101 });
			expect($scope.viewers).toEqual(101);	
		});

	});
})();
