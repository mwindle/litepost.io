/**
* Unit tests for the EventController 
*/
(function () {
	'use strict';

	var mocks = {};

	// Setup mock objects
	beforeEach(function () {
		mocks.user = {
			id: 'abcdef',
			username: 'someone'
		};

		// Mocked Event object
		mocks.event = {
			id: '123456789',
			socket: 'event-socket-id',
			name: 'Mocked Event',
			username: mocks.user.username,
			owner: mocks.user.id,
			slug: 'mocked-event',
			start: new Date(),
			hidden: false
		};

		// Mocked Message object array
		mocks.messages = [
			{
				id: 'id-one',
				eventSocket: mocks.event.socket,
				author: mocks.user.id,
				text: 'Hello World!',
				html: '<p>Hello World!</p>',
				sent: new Date()
			},
			{
				id: 'id-two',
				eventSocket: mocks.event.socket,
				author: mocks.user.id,
				text: 'Hello Again World!',
				html: '<p>Hello Again World!</p>',
				sent: new Date()					
			}
		];

		// Mock a new Message object
		mocks.newMessage = {
			id: 'new-id',
			eventSocket: mocks.event.socket,
				author: mocks.user.id,
			text: 'New Message!',
			html: '<p>New Message!</p>',
			sent: new Date()
		};

	});

	describe('EventController', function () {
		var $scope, $controller, $stateParams, createController, User, Event, Message, EventSocket;

		// Load the main application module from the global app config
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		// Setup injected services
		beforeEach(inject(function ($injector) {
			$scope = $injector.get('$rootScope');
			$controller = $injector.get('$controller');
			$stateParams = $injector.get('$stateParams');
			User = $injector.get('User');
			Event = $injector.get('Event');
			Message = $injector.get('Message');
			EventSocket = $injector.get('EventSocket');
		}));

		// Expose method to create a controller
		beforeEach(function () {
			createController = function () {
				return $controller('EventController', {
					$scope: $scope
				});
			};
		});

		beforeEach(function () {
			$stateParams.username = mocks.user.username;
			$stateParams.slug = mocks.event.slug;
		});

		beforeEach(function () {
			spyOn(User, 'get');
			spyOn(Event, 'get');
			spyOn(Message, 'query');
			spyOn(EventSocket, 'connect');
			spyOn(EventSocket, 'disconnect');
			spyOn(EventSocket, 'on');
			spyOn(EventSocket, 'emit');
		});

		it('should load the event owner', function () {
			createController();
			expect(User.get).toHaveBeenCalled();
			expect(User.get.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ 
				username: mocks.user.username 
			}));
		});

		it('should not load the owner or event if no username provided', function () {
			$stateParams.username = null;
			createController();
			expect(User.get).not.toHaveBeenCalled();
			expect(Event.get).not.toHaveBeenCalled();
		});

		it('should load the event', function () {
			createController();
			expect(Event.get).toHaveBeenCalled();
			expect(Event.get.calls.mostRecent().args[0])
				.toEqual(jasmine.objectContaining({ 
					username: mocks.user.username, 
					slug: mocks.event.slug 
				}));
		});

		it('should not load the event if slug is missing', function () {
			$stateParams.slug = null;
			createController();
			expect(Event.get).not.toHaveBeenCalled();
		});

		it('should load the messages for the event', function () {
			Event.get.and.callFake(function () {
				$scope.event = mocks.event;
				arguments[1](mocks.event);
			});
			createController();
			expect(Message.query.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
				event: mocks.event.id
			}));
		});

		it('should setup socket and listeners when event is loaded', function () {
			Event.get.and.callFake(function () {
				$scope.event = mocks.event;
				arguments[1](mocks.event);
			});
			createController();
			expect(EventSocket.connect).toHaveBeenCalled();
		});

		it('should disconnect from socket when scope is destroyed', function () {
			Event.get.and.callFake(function () {
				$scope.event = mocks.event;
				arguments[1](mocks.event);
				$scope.$destroy();
			});
			createController();
			expect(EventSocket.disconnect).toHaveBeenCalled();
		});

		it('should set typing details when socket emits typing message', function () {
			var typing = { author: 'whatever' };
			EventSocket.on.and.callFake(function (event, cb) {
				if(event === 'typing') {
					cb(typing);
					expect($scope.typing).toEqualData(typing);
				}
			});
			Event.get.and.callFake(function () {
				$scope.event = mocks.event;
				arguments[1](mocks.event);
			});
			createController();
		});

		it('should clear typing details when socket emits stop-typing message', function () {
			EventSocket.on.and.callFake(function (event, cb) {
				if(event === 'stop-typing') {
					cb();
					expect($scope.typing).toBeFalsy();
				}
			});
			Event.get.and.callFake(function () {
				$scope.event = mocks.event;
				arguments[1](mocks.event);
			});
			createController();
		});

		it('should add message to unread when socket emits new-message', function () {
			var message = { id: '1234', text: 'something' };
			EventSocket.on.and.callFake(function (event, cb) {
				if(event === 'new-message') {
					var len = $scope.unread.length;
					cb(message);
					expect($scope.unread.length).toEqual(len + 1);
				}
			});
			Event.get.and.callFake(function () {
				$scope.event = mocks.event;
				arguments[1](mocks.event);
			});
			createController();
		});

		it('should delete a message when socket emits new-message', function () {
			EventSocket.on.and.callFake(function (event, cb) {
				if(event === 'delete-message') {
					$scope.messages = [mocks.messages[0]];
					cb($scope.messages[0]);
					expect($scope.messages.length).toEqual(0);
				}
			});
			Event.get.and.callFake(function () {
				$scope.event = mocks.event;
				arguments[1](mocks.event);
			});
			createController();
		});

	});

	describe('EventSettingsController', function () {
		var createController, $scope, $location, $state, $stateParams, $timeout, Event;

		// Load the main application module from the global app config
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		// Setup injected services
		beforeEach(inject(function ($injector) {
			$scope = $injector.get('$rootScope');
			$state = $injector.get('$state');
			$stateParams = $injector.get('$stateParams');
			Event = $injector.get('Event');
			var $controller = $injector.get('$controller');
			createController = function () {
				return $controller('EventSettingsController', {
					$scope: $scope
				});
			};
		}));

		beforeEach(function () {
			$stateParams.username = mocks.user.username;
			$stateParams.slug = mocks.event.slug;
		});

		beforeEach(function () {
			spyOn(Event, 'get');
			$scope.canEditEvent = jasmine.createSpy('canEditEvent');
			$scope.canEditEvent.and.callFake(function () { return true; });
		});

		it('should load the event', function () {
			createController();
			expect(Event.get).toHaveBeenCalled();
			expect(Event.get.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ 
				username: mocks.user.username,
				slug: mocks.event.slug
			}));
		});

		it('should change state when missing required stateParams', function () {
			spyOn($state, 'go');
			$stateParams.username = null;
			createController();
			expect($state.go).toHaveBeenCalled();
		});

		it('should change state when user is not authorized to edit the event', function () {
			spyOn($state, 'go');
			Event.get.and.callFake(function () {
				$scope.canEditEvent.and.callFake(function () { return false; });
				$scope.event = mocks.event;
				arguments[1](mocks.event);
				expect($state.go).toHaveBeenCalled();
			});
			createController();
		});

		it('should save the updated event', function () {
			Event.get.and.callFake(function () {
				$scope.event = new Event(mocks.event);
				arguments[1]($scope.event);
				spyOn($scope.updatedEvent, '$save');
				$scope.save();
				expect($scope.updatedEvent.$save).toHaveBeenCalled();
			});
			createController();
		});

		it('should delete an event', function () {
			Event.get.and.callFake(function () {
				$scope.event = new Event(mocks.event);
				arguments[1]($scope.event);
				spyOn($scope.event, '$delete');
				$scope.delete();
				expect($scope.event.$delete).toHaveBeenCalled();
			});
			createController();
		});

	});

})();
