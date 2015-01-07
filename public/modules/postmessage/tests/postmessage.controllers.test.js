/**
* Unit tests for the PostController 
*/
(function () {
	'use strict';


	describe('PostController', function () {
		var $httpBackend, $scope, $state, $stateParams, $controller, $timeout, createController, mocks, EventSocket;

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
			$timeout = $injector.get('$timeout');
		}));

		// Expose method to create a controller
		beforeEach(function () {
			createController = function () {
				return $controller('PostController', {
					$scope: $scope,
					$stateParams: $stateParams,
					$state: $state,
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
			EventSocket.emit = function (event, message, callback) {
				if(EventSocket[event]) {
					EventSocket[event].forEach(function(callback) {
						callback.call(this, message, callback);
					});
				}
			};
		});

		// Setup mock objects
		beforeEach(function () {
			mocks = {};
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

			// Mock a new Message object
			mocks.message = {
				_id: 'new-id',
				event: mocks.event._id,
				text: 'New Message!',
				html: '<p>New Message!</p>',
				sent: new Date()
			};

		});

		// Setup state mocks
		beforeEach(function () {
			$state = {
				go: function () {}
			};
			$stateParams = {
				channel: mocks.event.channel
			};
		});

		// Setup request handlers
		beforeEach(function () {
			mocks.eventGetRequest = 'api/events?channel=' + mocks.event.channel;
			$httpBackend.when('GET', mocks.eventGetRequest).respond(mocks.event);

			mocks.messageGetRequest = 'api/events/' + mocks.event.channel + '/messages/' + mocks.message._id;
			$httpBackend.when('GET', mocks.messageGetRequest).respond(mocks.message);

			mocks.messagePostRequest = 'api/events/' + mocks.event.channel + '/messages';
			$httpBackend.when('POST', mocks.messagePostREquest).respond(mocks.message);

			mocks.updateMessagePostRequest = mocks.messageGetRequest;
			$httpBackend.when('POST', mocks.updateMessagePostRequest).respond(mocks.message);

			mocks.messageDeleteRequest = mocks.messageGetRequest;
			$httpBackend.when('DELETE', mocks.messageDeleteRequest).respond(mocks.message);
		});

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		it('should get the event from the service', function () {
			$httpBackend.expectGET(mocks.eventGetRequest);
			var controller = createController();
			$httpBackend.flush();
			expect($scope.event).toEqualData(mocks.event);
		});

		it('should tolerate no event from the service', function () {
			$httpBackend.expectGET(mocks.eventGetRequest).respond();
			var controller = createController();
			$httpBackend.flush();
			expect($scope.event).toEqualData({});
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

		it('should know when it\'s updating an existing or creating a new message', function () {
			var controller = createController();
			$httpBackend.flush();
			expect($scope.isUpdatingExisting()).toBeFalsy();
			$stateParams.messageId = mocks.message._id;
			controller = createController();
			$httpBackend.flush();
			expect($scope.isUpdatingExisting()).toBe(true);
		});

		it('should load a message for editing if provided', function () {
			$httpBackend.expectGET(mocks.messageGetRequest);
			$stateParams.messageId = mocks.message._id;
			var controller = createController();
			$httpBackend.flush();
			expect($scope.editingMessage).toEqualData(mocks.message);
		});

		it('should know when a message is still loading', function () {
			$stateParams.messageId = mocks.message._id;
			var controller = createController();
			expect($scope.isMessageLoaded()).toBeFalsy();
			$httpBackend.flush();
			expect($scope.isMessageLoaded()).toBe(true);
		});

		it('should update the editingMessage when content is edited', function () {
			var controller = createController();
			$httpBackend.flush();
			var str = 'new message content';
			$scope.edited(str);
			expect($scope.editingMessage.text).toEqual(str);
		});

		it('should call marked to set the editingMessage html when content is edited', function () {
			var str = 'custom string';
			window.marked = function () { return str; };
			var controller = createController();
			$httpBackend.flush();
			$scope.edited('whatever');
			expect($scope.editingMessage.html).toEqual(str);
		});

		it('should call startTyping when content is first edited', function () {
			var controller = createController();
			$httpBackend.flush();
			spyOn($scope, 'startTyping');
			$scope.edited('whatever');
			expect($scope.startTyping).toHaveBeenCalled();
		});

		it('should call stopTyping when content hasn\'t been edited in a while', function () {
			var controller = createController();
			$httpBackend.flush();
			$scope.edited('whatever');
			spyOn($scope, 'stopTyping');
			$timeout.flush();
			expect($scope.stopTyping).toHaveBeenCalled();
		});

		it('should not be in the typing state by default', function () {
			var controller = createController();
			$httpBackend.flush();
			expect($scope.isTyping()).toBeFalsy();
		});

		it('should send a socket typing message when startTyping is called', function () {
			var controller = createController();
			$httpBackend.flush();
			spyOn(EventSocket, 'emit');
			$scope.startTyping();
			expect(EventSocket.emit).toHaveBeenCalled();
		});

		it('should send a socket stop-typing message when stopTyping is called', function () {
			var controller = createController();
			$httpBackend.flush();
			$scope.startTyping();
			spyOn(EventSocket, 'emit');
			$scope.stopTyping();
			expect(EventSocket.emit).toHaveBeenCalled();
		});

		it('should save a new message to the server when publish is called', function () {
			var controller = createController();
			$httpBackend.flush();
			$httpBackend.expectPOST(mocks.messagePostREquest);
			$scope.editingMessage.text = 'Whatever';
			$scope.editingMessage.html = 'Whatever';
			$scope.publish();
			$httpBackend.flush();
		});

		it('should save an existing message to the server when update is called', function () {
			$stateParams.messageId = mocks.message._id;
			var controller = createController();
			$httpBackend.flush();
			expect($scope.editingMessage).toEqualData(mocks.message);
			$httpBackend.expectPOST(mocks.updateMessagePostRequest);
			$scope.update();
			$httpBackend.flush();
		});

		it('should delete an existing message from the server when delete is called', function () {
			$stateParams.messageId = mocks.message._id;
			var controller = createController();
			$httpBackend.flush();
			expect($scope.editingMessage).toEqualData(mocks.message);
			$httpBackend.expectDELETE(mocks.messageDeleteRequest);
			$scope.delete();
			$httpBackend.flush();
		});

	});
})();
