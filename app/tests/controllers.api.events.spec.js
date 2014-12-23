'use strict';

require('../models/user');
require('../models/event');
var mongoose = require('mongoose'),
	mockgoose = require('mockgoose'),
	httpMocks = require('node-mocks-http'),
	events = require('../controllers/api/events');
mockgoose(mongoose);
var User = mongoose.model('User');
var Event = mongoose.model('Event');

describe('/api/events', function () {
	var req, res, mocks;

	// Setup data-only equals comparison for objects
	beforeEach(function() {
		this.addMatchers({

			/**
			* Compares the data of two objects/properties for equality. 
			* Checks for equality of all boolean, number, and string properties and 
			* sub-object properties of the provided actual and expected. 
			*/
			toEqualData: function(expected) {

        return (function compare(actual, expected) {
        	// If expected is undefined (not provided to function), return true if
        	// actual is also undefined, false otherwise. 
        	if(expected === undefined) {
        		return actual === undefined;
        	}

        	// Test if actual is null first since typeof null === 'object' and we don't
					// want to fall into that case here. 
					if(actual === null) {
						return expected === null;
					}

					switch(typeof actual) {
						case 'object':
							// Get the actual and expected properties of the object
							var keys = Object.getOwnPropertyNames(actual);
							var expectedKeys = Object.getOwnPropertyNames(expected);

							// Make sure they have the same number of properties
							if(keys.length !== expectedKeys.length) {
								return false;
							}

							// Iterate over actual keys and recursively compare with expected
							for(var i=0; i<keys.length; i++) {
								if(!compare(actual[keys[i]], expected[keys[i]])) {
									return false;
								}
							}
							break;
						case 'boolean':
						case 'number':
						case 'string':
							if(actual !== expected) {
								return false;
							}
							break;
						default:
							// Ignore Functions, Symbols, and anything else
							break;
					}
					return true;
        })(this.actual, expected);			
			}
		});
	});

	beforeEach(function (done) {
		mockgoose.reset();
		done();
	});

	beforeEach(function (done) {
		mocks = {};
		new User({
			email: 'test@valid.com',
			password: 'testing'
		}).save(function (err, user) {
			mocks.user = user;
			done();
		});
	});

	beforeEach(function (done) {
		mocks.event = new Event({
			name: 'Test Event',
			channel: 'test-event',
			users: [{
				user: mocks.user,
				role: 'creator'
			}],
			start: new Date(),
			description: 'Test description'
		}).save(function (err, event) {
			mocks.event = event;
			done();
		});
	});

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

		it('should respond with the an event', function (done) {
			res.json = function (event) {
				expect(event.toObject()).toEqualData(mocks.event.toObject());
				done();
			};
			events.getEvent(req, res);
		});

		it('should respond with 404 when the event doesn\'t exist', function (done) {
			res.json = function (json) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			// Set the id in the params to be a valid, non-existent id
			req.params.id = '000000000000000000000000';
			events.getEvent(req, res);
		});

		it('should respond with 404 when an invalid id is provided', function (done) {
			res.json = function (json) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			// Set the id in the params to be invalid
			req.params.id = 'invalid';
			events.getEvent(req, res);
		});

		it('should not be vulnerable to mongo injection', function (done) {
			res.json = function (json) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			// Set the id in the params with a mongo injection value
			req.params.id = { '$gt': '' };
			events.getEvent(req, res);
		});

	});

	describe('getEventByChannel method', function () {

		it('should respond with the an event', function (done) {
			res.json = function (event) {
				expect(event.toObject()).toEqualData(mocks.event.toObject());
				done();
			};
			events.getEventByChannel(req, res);
		});

		it('should respond with 404 when the event doesn\'t exist', function (done) {
			res.json = function (json) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			// Set the channel in the query to a non-existent one
			req.query.channel = 'does-not-exist';
			events.getEventByChannel(req, res);
		});

		it('should respond with 400 when no channel is provided', function (done) {
			res.json = function (json) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			// Set the id in the params to be invalid
			req.query.channel = '';
			events.getEventByChannel(req, res);
		});

		it('should not be vulnerable to mongo injection', function (done) {
			res.json = function (json) {
				expect(res.statusCode).toEqual(404);
				done();
			};
			// Set the channel in the query with a mongo injection value
			req.query.channel = { '$gt': '' };
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
			req.body.name = 'aa';
			events.createEvent(req, res);
		});

		it('should fail to create an event when name is too long (>128 char)', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.name = '';
			for(var i=0; i<129; i++) {
				req.body.name += 'a';
			}
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
			req.body.channel = '+++invalid+++';
			events.createEvent(req, res);
		});

		it('should fail to create an event when channel is too short (<3 char)', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.channel = 'aa';
			events.createEvent(req, res);
		});

		it('should fail to create an event when channel is too long (>32 char)', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.channel = '';
			for(var i=0; i<33; i++) {
				req.body.channel += 'a';
			}
			events.createEvent(req, res);
		});

		it('should fail to create an event when description is too long (>1024 char)', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.description = '';
			for(var i=0; i<1025; i++) {
				req.body.description += 'a';
			}
			events.createEvent(req, res);
		});

	});

	describe('updateEvent method', function () {
		var updatedEvent = new Event({
			name: 'Updated Event Name',
			channel: 'new-channel',
			hidden: true,
			start: new Date(),
			description: 'Updated'
		});

		beforeEach(function () {
			req.url += '/' + mocks.event._id;
			req.method = 'POST';
			req.body = {
				name: updatedEvent.name
			};
		});

		it('should update an event when new name provided', function (done) {
			res.json = function (event) {
				expect(event.name).toEqual(updatedEvent.name);
				done();
			};
			events.updateEvent(req, res);
		});

		it('should update an event when new name and channel provided', function (done) {
			res.json = function (event) {
				expect(event.name).toEqual(updatedEvent.name);
				expect(event.channel).toEqual(updatedEvent.channel);
				done();
			};
			req.body.channel = updatedEvent.channel;
			events.updateEvent(req, res);
		});

		it('should update an event when all new properties are provided', 
		function (done) {
			res.json = function (event) {
				expect(event.name).toEqual(updatedEvent.name);
				expect(event.channel).toEqual(updatedEvent.channel);
				expect(!!event.hidden).toEqual(!!updatedEvent.hidden);
				expect(event.start).toEqual(updatedEvent.start);
				expect(event.description).toEqual(updatedEvent.description);
				done();
			};
			req.body = updatedEvent.toObject();
			events.updateEvent(req, res);
		});

		it('should fail to update with 400 status when an invalid channel is provided', 
		function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(400);
				done();
			};
			req.body.channel = '++invalid++';
			events.updateEvent(req, res);
		});

		it('should fail to update with 404 status when a non-existent event id is provided', 
		function (done) {
			res.json = function (err) {
				console.log(err);
				expect(res.statusCode).toEqual(404);
				done();
			};
			req.params.id = '000000000000000000000000';
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
			req.params.id = '000000000000000000000000';
			events.deleteEvent(req, res);
		});

	});

});
