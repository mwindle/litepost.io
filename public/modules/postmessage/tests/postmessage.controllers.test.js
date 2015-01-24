/**
* Unit tests for the PostController 
*/
(function () {
	'use strict';


	describe('PostController', function () {
		var $scope, $state, $stateParams, $timeout, createController, mocks = {}, Event, Message, EventSocket;

		// Load the main application module from the global app config
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		// Setup injected services
		beforeEach(inject(function ($injector) {
			$scope = $injector.get('$rootScope');
			$state = $injector.get('$state');
			$stateParams = $injector.get('$stateParams');
			$timeout = $injector.get('$timeout');
			Event = $injector.get('Event');
			Message = $injector.get('Message');
			EventSocket = $injector.get('EventSocket');
			var $controller = $injector.get('$controller');
			createController = function () {
				return $controller('PostController', {
					$scope: $scope
				});
			};
		}));

		beforeEach(function () {
			// Mocked user
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
			mocks.message =	{
				id: 'id-one',
				event: mocks.event.id,
				eventSocket: mocks.event.socket,
				author: mocks.user.id,
				text: 'Hello World!',
				html: '<p>Hello World!</p>',
				sent: new Date()
			};

		});

		// Setup state mocks
		beforeEach(function () {
			$stateParams.username = mocks.user.username;
			$stateParams.slug = mocks.event.slug;
		});

		beforeEach(function () {
			spyOn(Event, 'get');
			spyOn(Message, 'get');
			spyOn(EventSocket, 'connect').and.callFake(function () { return true; });
			spyOn(EventSocket, 'disconnect');
			spyOn(EventSocket, 'on');
			spyOn(EventSocket, 'emit');
		});

		it('should know when it\'s updating an existing or creating a new message', function () {
			createController();
			expect($scope.isUpdatingExisting()).toBeFalsy();

			$stateParams.messageId = mocks.message.id;
			createController();
			expect($scope.isUpdatingExisting()).toBeTruthy();
		});

		it('should load a message for editing if provided', function () {
			$stateParams.messageId = mocks.message.id;
			createController();
			expect(Message.get.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ 
				id: mocks.message.id,
				populate: 'author'
			}));
		});

		it('should update the editingMessage when content is edited', function () {
			createController();
			$scope.editingMessage = new Message(mocks.message);
			$scope.editingMessage.html = null;
			$scope.edited('new content');
			expect($scope.editingMessage.html).not.toBe(null);
		});

		it('should call startTyping when content is first edited', function () {
			createController();
			spyOn($scope, 'startTyping');
			$scope.editingMessage = new Message(mocks.message);
			$scope.editingMessage.html = null;
			$scope.edited('new content');
			expect($scope.startTyping).toHaveBeenCalled();
		});

		it('should send a socket typing message when startTyping is called', function () {
			createController();
			$scope.startTyping();
			expect(EventSocket.emit).toHaveBeenCalled();
		});

		it('should send a socket stop-typing message when stopTyping is called', function () {
			createController();
			$scope.stopTyping();
			expect(EventSocket.emit).toHaveBeenCalled();
		});

		it('should save a new message to the server when publish is called', function () {
			createController();
			$scope.editingMessage = new Message(mocks.message);
			spyOn($scope.editingMessage, '$save');
			$scope.publish();
			expect($scope.editingMessage.$save).toHaveBeenCalled();		
		});

		it('should save an existing message to the server when update is called', function () {
			createController();
			$scope.editingMessage = new Message(mocks.message);
			spyOn($scope.editingMessage, '$save');
			$scope.update();
			expect($scope.editingMessage.$save).toHaveBeenCalled();	
		});

		it('should delete an existing message from the server when delete is called', function () {
			createController();
			$scope.editingMessage = new Message(mocks.message);
			spyOn($scope.editingMessage, '$delete');
			$scope.delete();
			expect($scope.editingMessage.$delete).toHaveBeenCalled();	
		});

	});
})();
