'use strict';

var httpMocks = require('node-mocks-http'),
	matchers = require('./matchers'),
	mocks = require('./mocks'),
	events = require('../controllers/api/events');

describe('/api/events', function () {
	var req, res;

	mocks.setup();

	beforeEach(function () {
		req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/events',
      params: {
        id: mocks.event._id.toString() // Must use toString as mockgoose saves this as object
      },
      query: {
      	channel: mocks.event.channel
      }
    });
		res = httpMocks.createResponse();
	});

	describe('getEvent method', function () {

		it('should respond with an event', function (done) {
			res.json = function (event) {
				expect(event.toObject()).toEqualData(mocks.event.toObject());
				done();
			};
			events.getEvent(req, res);
		});

		it('should respond with 404 when the event doesn\'t exist', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			// Set the id in the params to be a valid, non-existent id
			req.params.id = mocks.nonExistentId;
			events.getEvent(req, res);
		});

		it('should respond with 404 when an invalid id is provided', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			// Set the id in the params to be invalid
			req.params.id = mocks.invalidId;
			events.getEvent(req, res);
		});

		it('should not be vulnerable to mongo injection', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			// Set the id in the params with a mongo injection value
			req.params.id = mocks.mongoInjectionValue;
			events.getEvent(req, res);
		});

	});

	describe('getEventByChannel method', function () {

		it('should respond with an event', function (done) {
			res.json = function (event) {
				expect(event.toObject()).toEqualData(mocks.event.toObject());
				done();
			};
			events.getEventByChannel(req, res);
		});

		it('should respond with 404 when an event doesn\'t exist', function (done) {
			res.json = function (json) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			// Set the channel in the query to a non-existent one
			req.query.channel = mocks.nonExistentChannel;
			events.getEventByChannel(req, res);
		});

		it('should respond with 400 when no channel is provided', function (done) {
			res.json = function (json) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			// Set the id in the params to be empty
			req.query.channel = '';
			events.getEventByChannel(req, res);
		});

		it('should not be vulnerable to mongo injection', function (done) {
			res.json = function (json) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			// Set the channel in the query with a mongo injection value
			req.query.channel = mocks.mongoInjectionValue;
			events.getEventByChannel(req, res);
		});

	});

	describe('createEvent method', function () {
		
		// Overwrite request with method of POST and body params
		beforeEach(function () {
			req.method = 'POST';
			req.body = {
      	name: 'A new event',
      	channel: 'a-new-event'
      };
      req.user = mocks.user;
		});

		it('should create an event when only name and channel are provided', function (done) {
			res.json = function (event) {
				expect(event._id).toBeTruthy();
				done();
			};
			events.createEvent(req, res);
		});

		it('should create an event when all its properties are provided', function (done) {
			res.json = function (event) {
				expect(event._id).toBeTruthy();
				done();
			};
			req.body.start = new Date();
			req.body.hidden = true;
			req.body.description = 'This is a great event description';
			events.createEvent(req, res);
		});

		it('should fail to create an event when its name is missing', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.name = '';
			events.createEvent(req, res);
		});

		it('should fail to create an event when name is too short (<3 char)', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.name = mocks.tooShortEventName;
			events.createEvent(req, res);
		});

		it('should fail to create an event when name is too long (>128 char)', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.name = mocks.tooLongEventName;
			events.createEvent(req, res);
		});

		it('should fail to create an event when channel is missing', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.channel = '';
			events.createEvent(req, res);
		});

		it('should fail to create an event when channel contains disallowed characters', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.channel = mocks.invalidChannel;
			events.createEvent(req, res);
		});

		it('should fail to create an event when channel is too short (<3 char)', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.channel = mocks.tooShortEventChannel;
			events.createEvent(req, res);
		});

		it('should fail to create an event when channel is too long (>32 char)', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.channel = mocks.tooLongEventChannel;
			events.createEvent(req, res);
		});

		it('should fail to create an event when description is too long (>1024 char)', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.description = mocks.tooLongEventDescription;
			events.createEvent(req, res);
		});

	});

	describe('updateEvent method', function () {

		beforeEach(function () {
			req.url += '/' + mocks.event._id;
			req.method = 'POST';
			req.body = {
				name: mocks.updatedEvent.name
			};
		});

		it('should update an event when new name provided', function (done) {
			res.json = function (event) {
				expect(event.name).toEqual(mocks.updatedEvent.name);
				done();
			};
			events.updateEvent(req, res);
		});

		it('should update an event when new name and channel provided', function (done) {
			res.json = function (event) {
				expect(event.name).toEqual(mocks.updatedEvent.name);
				expect(event.channel).toEqual(mocks.updatedEvent.channel);
				done();
			};
			req.body.channel = mocks.updatedEvent.channel;
			events.updateEvent(req, res);
		});

		it('should update an event when all new properties are provided', function (done) {
			res.json = function (event) {
				expect(event.name).toEqual(mocks.updatedEvent.name);
				expect(event.channel).toEqual(mocks.updatedEvent.channel);
				expect(event.hidden).toEqual(mocks.updatedEvent.hidden);
				expect(event.start).toEqual(mocks.updatedEvent.start);
				expect(event.description).toEqual(mocks.updatedEvent.description);
				done();
			};
			req.body = mocks.updatedEvent.toObject();
			events.updateEvent(req, res);
		});

		it('should fail to update with 400 status when an invalid channel is provided', 
		function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.channel = mocks.invalidChannel;
			events.updateEvent(req, res);
		});

		it('should fail to update with 404 status when a non-existent event id is provided', 
		function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			req.params.id = mocks.nonExistentId;
			events.updateEvent(req, res);
		});

	});

	describe('deleteEvent method', function () {

		it('should delete a valid event if provided', function (done) {
			res.json = function (event) {
				expect(event.toObject()).toEqualData(mocks.event.toObject());
				done();
			};
			events.deleteEvent(req, res);
		});

		it('should fail to delete with a 404 if a non-existent event id is provided', function (done) {
			res.json = function (event) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			req.params.id = mocks.nonExistentId;
			events.deleteEvent(req, res);
		});

		it('should fail to delete with a 404 if an invalid event id is provided', function (done) {
			res.json = function (event) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			req.params.id = mocks.invalidId;
			events.deleteEvent(req, res);
		});

	});

});
