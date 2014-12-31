'use strict';

var httpMocks = require('node-mocks-http'),
	matchers = require('./matchers'),
	mocks = require('./mocks'),
	users = require('../controllers/api/users');

describe('/api/me', function () {
	var req, res;

	mocks.setup();

	beforeEach(function () {
		req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/me'
    });
		res = httpMocks.createResponse();
	});

	beforeEach(function () {
		req.user = mocks.user;
	});

	describe('getMe method', function () {

		it('should respond with the current user', function (done) {
			res.json = function (me) {
				expect(me._id.toString()).toEqual(mocks.user._id.toString());
				done();
			};
			users.getMe(req, res);
		});

		it('should respond with 401 status when user is not authenticated', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(401);
				done();
			};
			req.user = null;
			users.getMe(req, res);
		});

		it('should not include password in returned user object', function (done) {
			res.json = function (me) {
				expect(me.password).toEqual(undefined);
				done();
			};
			users.getMe(req, res);
		});

	});

	describe('getMyEvents method', function () {

		it('should respond with events for current user', function (done) {
			res.json = function (events) {
				expect(events[0].toObject()).toEqualData(mocks.event.toObject());
				done();
			};
			users.getMyEvents(req, res);
		});

		it('should respond with 401 status when user is not authenticated', function (done) {
			res.json = function (err) {
				expect(res.statusCode).toEqual(401);
				done();
			};
			req.user = null;
			users.getMyEvents(req, res);
		});

	});

});