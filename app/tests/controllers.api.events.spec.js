'use strict';

var mocks = require('./mocks'),
	request = require('supertest'),
	app = require('../../server'),
	p = '/api/events';

describe(p, function () {

	mocks.setup();

	it('should get all events for a user', function (done) {
		request(app)
			.get(p)
			.query({ username: mocks.user.username })
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				expect(Array.isArray(res.body)).toBeTruthy();
				res.body.forEach(function (event) {
					expect(event.username).toEqual(mocks.user.username);
				});
				done();
			});
	});

	it('should get a specific event by id', function (done) {
		request(app)
			.get(p + '/' + mocks.event.id)
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				expect(res.body.id).toEqual(mocks.event.id);
				done();
			});
	});

	it('should fail to create an event if not authenticated', function (done) {
		request(app)
			.post(p)
			.send({ name: 'New Event' })
			.expect('Content-type', /json/)
			.expect(401, done);
	});

	it('should create an event if authenticated', function (done) {
		request(app)
			.post(p)
			.set('Authorization', 'Bearer ' + mocks.user.getAuthToken())
			.send({ name: 'New Event' })
			.expect('Content-type', /json/)
			.expect(201, done);
	});

	it('should fail to create an event with invalid data', function (done) {
		request(app)
			.post(p)
			.set('Authorization', 'Bearer ' + mocks.user.getAuthToken())
			.send({ name: 'New Event' })
			.send({ slug: '**invalid**' })
			.expect('Content-type', /json/)
			.expect(400, done);
	});

	it('should fail to update an event if not authenticated', function (done) {
		request(app)
			.put(p + '/' + mocks.event.id)
			.send({ name: 'Updated' })
			.expect('Content-type', /json/)
			.expect(401, done);
	});

	it('should fail to update an event if not authorized', function (done) {
		request(app)
			.put(p + '/' + mocks.event.id)
			.set('Authorization', 'Bearer ' + mocks.emptyUser.getAuthToken())
			.send({ name: 'Updated' })
			.expect('Content-type', /json/)
			.expect(403, done);
	});

	it('should update an event if authenticated', function (done) {
		request(app)
			.put(p + '/' + mocks.event.id)
			.set('Authorization', 'Bearer ' + mocks.user.getAuthToken())
			.send({ name: 'Updated' })
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				expect(res.body.name).toEqual('Updated');
				done();
			});
	});

	it('should fail to update an event with invalid data', function (done) {
		request(app)
			.put(p + '/' + mocks.event.id)
			.set('Authorization', 'Bearer ' + mocks.user.getAuthToken())
			.send({ name: 'Updated' })
			.send({ slug: '**invalid**' })
			.expect('Content-type', /json/)
			.expect(400, done);
	});

	it('should fail to delete an event if not authenticated', function (done) {
		request(app)
			.delete(p + '/' + mocks.event.id)
			.expect('Content-type', /json/)
			.expect(401, done);		
	});

	it('should fail to delete an event if not authorized', function (done) {
		request(app)
			.delete(p + '/' + mocks.event.id)
			.set('Authorization', 'Bearer ' + mocks.emptyUser.getAuthToken())
			.expect('Content-type', /json/)
			.expect(403, done);		
	});


	it('should delete an event if authenticated', function (done) {
		request(app)
			.delete(p + '/' + mocks.event.id)
			.set('Authorization', 'Bearer ' + mocks.user.getAuthToken())
			.expect('Content-type', /json/)
			.expect(200, done);		
	});

});