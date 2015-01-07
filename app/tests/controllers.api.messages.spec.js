'use strict';

var proxyquire = require('proxyquire'),
	httpMocks = require('node-mocks-http'),
	matchers = require('./matchers'),
	mocks = require('./mocks'),
	stubs = { 
		marked: function marked(text) {
			marked.called = true;
			return text;
		},
		emitter: {
			emit: function emit(channel, message) {
				emit.called = true;
			}
		}
	},
	messages = proxyquire('../controllers/api/messages', { 
		'marked': stubs.marked,
		'../../../public/js/marked-setup': {},
		'../../../config/emitter': stubs.emitter
	});

describe('/api/messages', function () {
	var req, res;

	mocks.setup();

	beforeEach(function () {
		req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/messages',
      params: {
        channel: mocks.event.channel.toString() // Must use toString as mockgoose saves this as object
      }
    });
		res = httpMocks.createResponse();
	});

	// Clear called flag on stubbed functions
	beforeEach(function () {
		stubs.marked.called = false;
		stubs.emitter.emit.called = false;
	});

	describe('getMessages method', function () {

		it('should respond with the messages for an event', function (done) {
			res.json = function (messages) {
				expect(messages[0].toObject()).toEqualData(mocks.message.toObject());
				done();
			};
			messages.getMessages(req, res);
		});

		it('should respond with a 404 when getting messages for an event that doesn\'t exist', function (done) {
			res.json = function (messages) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			req.params.channel = mocks.invalidChannel;
			messages.getMessages(req, res);
		});

	});

	describe('getMessage method', function () {

		it('should respond with a message', function (done) {
			res.json = function (message) {
				expect(message.toObject()).toEqualData(mocks.message.toObject());
				done();
			};
			req.params.id = mocks.message._id.toString();
			messages.getMessage(req, res);
		});

		it('should respond with a 404 when a message doesn\'t exist', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			req.params.id = mocks.nonExistentId;
			messages.getMessage(req, res);
		});

		it('should respond with a 404 when an invalid message id is provided', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			req.params.id = mocks.invalidId;
			messages.getMessage(req, res);
		});

		it('should not be vulnerable to mongo injection', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			// Set the id in the params with a mongo injection value
			req.params.id = mocks.mongoInjectionValue;
			messages.getMessage(req, res);
		});

	});

	describe('createMessage method', function () {

		// Overwrite request with method of POST and body params
		beforeEach(function () {
			req.method = 'POST';
			req.body = {
      	event: mocks.event._id.toString(),
      	text: 'A new message'
      };
		});
		
		beforeEach(function () {
			req.user = mocks.user;
		});

		it('should create a message when valid event and text are provided', function (done) {
			res.json = function (message) {
				expect(message._id).toBeTruthy();
				done();
			};
			messages.createMessage(req, res);
		});

		it('should fail to create a message when text is empty', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.text = '';
			messages.createMessage(req, res);
		});

		it('should fail to create a message when a non-existent event is provided', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.event = mocks.nonExistentId;
			messages.createMessage(req, res);
		});

		it('should fail to create a message when its text is too long', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.text = mocks.tooLongMessageText;
			messages.createMessage(req, res);
		});

		it('should call marked to transform markdown to html', function (done) {
			res.json = function (message) {
				expect(stubs.marked.called).toBeTruthy();
				done();
			};
			messages.createMessage(req, res);
		});

		it('should call emitter.emit to broadcast message creation', function (done) {
			res.json = function (message) {
				expect(stubs.emitter.emit.called).toBeTruthy();
				done();
			};
			messages.createMessage(req, res);
		});

	});

	describe('updateMessage method', function () {

		// Overwrite request with method of POST and body params
		beforeEach(function () {
			req.method = 'POST';
			req.body = {
      	text: 'An \nupdated \nmessage'
      };
      req.params.id = mocks.message._id.toString();
		});

		it('should update a message when provided id and text are valid', function (done) {
			res.json = function (message) {
				expect(message.text).toEqual(req.body.text);
				done();
			};
			messages.updateMessage(req, res);
		});

		it('should call marked to transform markdown to html', function (done) {
			res.json = function (message) {
				expect(stubs.marked.called).toBeTruthy();
				done();
			};
			messages.updateMessage(req, res);
		});

		it('should call emitter.emit to broadcast message update', function (done) {
			res.json = function (message) {
				expect(stubs.emitter.emit.called).toBeTruthy();
				done();
			};
			messages.updateMessage(req, res);
		});

		it('should fail to update with 404 status when an invalid message id is provided', function (done) {
			res.json = function (message) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			req.params.id = mocks.invalidId;
			messages.updateMessage(req, res);
		});

		it('should fail to update with 404 status when a non-existent message id is provided', function (done) {
			res.json = function (message) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			req.params.id = mocks.nonExistentId;
			messages.updateMessage(req, res);
		});

		it('should fail to update with 400 status when text is missing', function (done) {
			res.json = function (message) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.text = '';
			messages.updateMessage(req, res);
		});

		it('should fail to update with 400 status when text is too long (>1024 char)', function (done) {
			res.json = function (message) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.text = mocks.tooLongMessageText;
			messages.updateMessage(req, res);
		});

	});

	describe('deleteMessage method', function () {

		beforeEach(function () {
			req.params.id = mocks.message._id.toString();
		});

		it('should delete a message when a valid id is provided', function (done) {
			res.json = function (message) {
				expect(message.toObject()).toEqualData(mocks.message.toObject());
				done();
			};
			messages.deleteMessage(req, res);
		});

		it('should call emitter.emit to broadcast message delete', function (done) {
			res.json = function (message) {
				expect(stubs.emitter.emit.called).toBeTruthy();
				done();
			};
			messages.deleteMessage(req, res);
		});

		it('should fail with 404 status when a non-existent message id is provided', function (done) {
			res.json = function (message) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			req.params.id = mocks.nonExistentId;
			messages.deleteMessage(req, res);
		});

		it('should fail with 404 status when an invalid message id is provided', function (done) {
			res.json = function (message) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			req.params.id = mocks.invalidId;
			messages.deleteMessage(req, res);
		});

	});

});
