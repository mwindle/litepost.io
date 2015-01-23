'use strict';

var mocks = require('./mocks'),
	request = require('supertest'),
	app = require('../../server'),
	p = '/api/messages';

describe(p, function () {

	mocks.setup();

	it('should get a specific message by id', function (done) {
		request(app)
			.get(p + '/' + mocks.message.id)
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				expect(res.body.id).toEqual(mocks.message.id);
				done();
			});
	});

	it('should get all messages associated with an event', function (done) {
		request(app)
			.get(p)
			.expect('Content-type', /json/)
			.query({ event: mocks.event.id })
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				expect(res.body.length).toEqual(1);
				expect(res.body[0].id).toEqual(mocks.message.id);
				done();
			});
	});

	it('should populate message author', function (done) {
		request(app)
			.get(p)
			.query({ event: mocks.event.id })
			.query({ populate: 'author' })
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				expect(res.body.length).toEqual(1);
				expect(res.body[0].author.username).toEqual(mocks.user.username);
				done();
			});
	});

	it('should create a message', function (done) {
		request(app)
			.post(p)
			.set('Authorization', 'Bearer ' + mocks.user.getAuthToken())
			.send({ event: mocks.event.id })
			.send({ text: 'Just testing things...' })
			.expect('Content-type', /json/)
			.expect(201, done);
	});

	it('should fail to create a message if not authenticated', function (done) {
		request(app)
			.post(p)
			.send({ text: 'Just testing things...' })
			.expect('Content-type', /json/)
			.expect(401, done);
	});

	it('should fail to create a message if not authorized', function (done) {
		request(app)
			.post(p)
			.set('Authorization', 'Bearer ' + mocks.emptyUser.getAuthToken())
			.send({ event: mocks.event.id })
			.send({ text: 'Just testing things...' })
			.expect('Content-type', /json/)
			.expect(403, done);
	});

	it('should fail to create a message if no event is specified', function (done) {
		request(app)
			.post(p)
			.set('Authorization', 'Bearer ' + mocks.user.getAuthToken())
			.send({ text: 'Just testing things...' })
			.expect('Content-type', /json/)
			.expect(400, done);
	});

	it('should update a message', function (done) {
		request(app)
			.put(p + '/' + mocks.message.id)
			.set('Authorization', 'Bearer ' + mocks.user.getAuthToken())
			.send({ text: 'Updated' })
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				expect(res.body.text).toEqual('Updated');
				done();
			});
	});

	it('should fail to update a message if not authenticated', function (done) {
		request(app)
			.put(p + '/' + mocks.message.id)
			.send({ text: 'Updated' })
			.expect('Content-type', /json/)
			.expect(401, done);
	});

	it('should fail to update a message if not authorized', function (done) {
		request(app)
			.put(p + '/' + mocks.message.id)
			.set('Authorization', 'Bearer ' + mocks.emptyUser.getAuthToken())
			.send({ text: 'Updated' })
			.expect('Content-type', /json/)
			.expect(403, done);
	});

	it('should now allow updating immutables', function (done) {
		request(app)
			.put(p + '/' + mocks.message.id)
			.set('Authorization', 'Bearer ' + mocks.user.getAuthToken())
			.send({ text: 'updated' })
			.send({ event: 'updated' })
			.send({ html: 'updated' })
			.send({ sent: new Date() })
			.send({ eventSocket: 'updated' })
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				expect(res.body.text).toEqual('updated');
				expect(res.body.event).toEqual(mocks.event.id);
				expect(res.body.html).not.toEqual('updated');
				expect(res.body.eventSocket).toEqual(mocks.message.eventSocket);
				done();
			});
	});

	it('should fail to delete a message if not authenticated', function (done) {
		request(app)
			.delete(p + '/' + mocks.message.id)
			.expect('Content-type', /json/)
			.expect(401, done);		
	});

	it('should fail to delete a message if not authorized', function (done) {
		request(app)
			.delete(p + '/' + mocks.message.id)
			.set('Authorization', 'Bearer ' + mocks.emptyUser.getAuthToken())
			.expect('Content-type', /json/)
			.expect(403, done);		
	});

	it('should delete a message', function (done) {
		request(app)
			.delete(p + '/' + mocks.message.id)
			.set('Authorization', 'Bearer ' + mocks.user.getAuthToken())
			.expect('Content-type', /json/)
			.expect(200, done);
	});

});