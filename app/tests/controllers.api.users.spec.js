'use strict';


var mocks = require('./mocks'),
	request = require('supertest'),
	app = require('../../server'),
	p = '/api/users';

describe(p, function () {

	mocks.setup();

	it('should get a specific user by id', function (done) {
		request(app)
			.get(p + '/' + mocks.user.id)
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				expect(res.body.id).toEqual(mocks.user.id);
				done();
			});
	});

	it('should get a specific user by username', function (done) {
		request(app)
			.get(p)
			.query({ username: mocks.user.username })
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				expect(res.body.username).toEqual(mocks.user.username);
				done();
			});
	});

	it('should get a specific user by email', function (done) {
		request(app)
			.get(p)
			.query({ email: mocks.user.email })
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				// Check username since email is pruned
				expect(res.body.username).toEqual(mocks.user.username);
				done();
			});
	});

	it('should prune sensitive user attributes', function (done) {
		request(app)
			.get(p + '/' + mocks.user.id)
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				expect(res.body.email).toBe(undefined);
				expect(res.body.password).toBe(undefined);
				expect(res.body.verified).toBe(undefined);
				done();
			});
	});

	it('should fail to provide listing of multiple users', function (done) {
		request(app)
			.get(p)
			.expect('Content-type', /json/)
			.expect(400, done);
	});

	it('should create a user', function (done) {
		request(app)
			.post(p)
			.send({ username: 'johndoe' })
			.send({ email: 'unique@newyork.com' })
			.send({ password: 'S3cure-ish' })
			.expect('Content-type', /json/)
			.expect(201, done);
	});

	it('should fail to create a user if username is not unique', function (done) {
		request(app)
			.post(p)
			.send({ username: mocks.user.username })
			.send({ email: 'unique@newyork.com' })
			.send({ password: 'S3cure-ish' })
			.expect('Content-type', /json/)
			.expect(400, done);
	});

	it('should fail to create a user if username is invalid', function (done) {
		request(app)
			.post(p)
			.send({ username: '*** invalid ***' })
			.send({ email: 'unique@newyork.com' })
			.send({ password: 'S3cure-ish' })
			.expect('Content-type', /json/)
			.expect(400, done);
	});

	it('should fail to create a user if email is not unique', function (done) {
		request(app)
			.post(p)
			.send({ username: 'johndoe' })
			.send({ email: mocks.user.email })
			.send({ password: 'S3cure-ish' })
			.expect('Content-type', /json/)
			.expect(400, done);
	});

	it('should fail to create a user if email is invalid', function (done) {
		request(app)
			.post(p)
			.send({ username: 'johndoe' })
			.send({ email: 'invalid-email' })
			.send({ password: 'S3cure-ish' })
			.expect('Content-type', /json/)
			.expect(400, done);
	});

	it('should update a user', function (done) {
		request(app)
			.put(p + '/' + mocks.user.id)
			.set('Authorization', 'Bearer ' + mocks.user.getAuthToken())
			.send({ name: 'Updated' })
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				expect(res.body.name).toEqual('Updated');
				done();
			});
	});

	it('should fail to update a user if not authenticated', function (done) {
		request(app)
			.put(p + '/' + mocks.user.id)
			.send({ name: 'Updated' })
			.expect('Content-type', /json/)
			.expect(401, done);
	});

	it('should fail to update a user if not authorized', function (done) {
		request(app)
			.put(p + '/' + mocks.user.id)
			.set('Authorization', 'Bearer ' + mocks.emptyUser.getAuthToken())
			.send({ name: 'Updated' })
			.expect('Content-type', /json/)
			.expect(403, done);
	});

	it('should not allow updating immutables', function (done) {
		request(app)
			.put(p + '/' + mocks.user.id)
			.set('Authorization', 'Bearer ' + mocks.user.getAuthToken())
			.send({ name: 'updated' })
			.send({ _id: 'updated' })
			.send({ username: 'updated' })
			.send({ email: 'updated@updated.com' })
			.send({ emailHash: 'updated' })
			.send({ verified: true })
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				expect(res.body.name).toEqual('updated');
				expect(res.body.id).toEqual(mocks.user.id);
				expect(res.body.username).toEqual(mocks.user.username);
				expect(res.body.email).toEqual(mocks.user.email);
				expect(res.body.emailHash).toEqual(mocks.user.emailHash);
				expect(res.body.verified).toEqual(mocks.user.verified);
				done();
			});
	});

	it('should fail to delete a user if not authenticated', function (done) {
		request(app)
			.delete(p + '/' + mocks.user.id)
			.expect('Content-type', /json/)
			.expect(401, done);		
	});

	it('should fail to delete a user if not authorized', function (done) {
		request(app)
			.delete(p + '/' + mocks.user.id)
			.set('Authorization', 'Bearer ' + mocks.emptyUser.getAuthToken())
			.expect('Content-type', /json/)
			.expect(403, done);		
	});

	it('should delete a user and their data', function (done) {
		request(app)
			.delete(p + '/' + mocks.user.id)
			.set('Authorization', 'Bearer ' + mocks.user.getAuthToken())
			.expect('Content-type', /json/)
			.expect(200)
			.end(function (err, res) {
				// Confirm their event is deleted too
				request(app)
					.get('/api/events/' + mocks.event.id)
					.expect('Content-type', /json/)
					.expect(404, done);
			});	
	});

});