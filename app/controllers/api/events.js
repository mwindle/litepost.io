'use strict';

/**
 * Module dependencies.
 */
var Event = require('mongoose').model('Event'),
	r = require('./rest').model(Event),
	errors = require('../../errors/errors'),
	users = require('./users');

module.exports.pruneEvent = function (event, principal) {
	var e = {};
	e._id = event._id;
	e.name = event.name;
	e.slug = event.slug;
	e.socket = event.socket;
	e.username = event.username;
	e.start = event.start;
	e.description = event.description;
	e.location = event.location;

	if(event.owner && event.owner._id) {
		e.owner = users.pruneUser(event.owner, principal);
	}
	return e;
};

var prune = function (req, res, next) {
	if(!res.locals.result) {
		return next();
	}

	if(Array.isArray(res.locals.result)) {
		for(var i=0; i<res.locals.result.length; i++) {
			res.locals.result[i] = module.exports.pruneEvent(res.locals.result[i], req.user);
		}
	} else {
		res.locals.result = module.exports.pruneEvent(res.locals.result, req.user);
	}
	next();
};

var clean = function (req, res, next) {
	if(!req.body.name) {
		return next(new errors.SchemaValidationError());
	}
	// Set event owner details with the current user
	req.body.owner = req.user._id;
	req.body.username = req.user.username;

	// If slug isn't provided, generate it from the name
	if(!req.body.slug && req.body.name) {
		req.body.slug = req.body.name.replace(/[^a-z0-9\-]/ig, '-');
	}

	// Make sure the slug is unique, or massage it to be unique
	Event.find({
		owner: req.user._id,
		slug: new RegExp('^' + req.body.slug + '(-[0-9]*)?$')
	}, function (err, events) {
		// Don't hard fail on error here, just might have a hard validation error if the username+slug isn't unique
		if(events && events.length) {
			req.body.slug += '-' + events.length;
		}
		next();
	});
};

var trimImmutable = function (req, res, next) {
	delete req.body._id;
	delete req.body.owner;
	delete req.body.username;
	delete req.body.socket;
	next();
};

var makeOneWithUsernameAndSlug = function (req, res, next) {
	if(req.query.username && req.query.slug) {
		return r.single(req, res, r.ensureResult.bind(null, req, res, next));
	}
	next();
};

module.exports.route = function (app) {

	app.get('/api/events/:id', r.get);
	app.get('/api/events', r.get, makeOneWithUsernameAndSlug);
	app.post('/api/events', clean, r.post);
	app.put('/api/events/:id', /*r.auth, */trimImmutable, r.validate, r.put);
	app.delete('/api/events/:id', /*r.auth, */r.del);

	app.all('/api/events*', prune, r.flush);
};

