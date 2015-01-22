'use strict';


/**
 * Module dependencies.
 */
var debug = require('debug')('api'),
	Event = require('mongoose').model('Event'),
	r = require('./rest').model(Event),
	errors = require('../../errors/errors'),
	users = require('./users');

/**
* Prunes the event based on what the principal is allowed to see.
*
* @param {Event} event instance of a Mongoose Event
* @param {User} [principal] currently authenticated user
* @return {object} pruned event
*/
module.exports.pruneEvent = function (event, principal) {
	if(!event) {
		return event;
	}
	
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
r.setPruner(module.exports.pruneEvent);

/**
* Express middleware to massage request body to prepare for
* event creation. Sets derived properties that are not allowed
* to be set from the request itself. This method requires there
* be a currently authenticated user with _id and username properties. 
*/
var cleanPost = function (req, res, next) {
	if(!req.body.name) {
		return next(new errors.SchemaValidationError());
	} else if (!req.user || !req.user._id || !req.user.username) {
		return next(new errors.UnauthorizedError());
	}
	// Set event owner details with the current user
	req.body.owner = req.user._id;
	req.body.username = req.user.username;

	// Requestor is not allowed to set the socket for an event
	delete req.body.socket;

	// If slug isn't provided, generate it from the name
	if(!req.body.slug && req.body.name) {
		// Replace non alphanumeric characters with dashes (-)
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

/**
* Express middleware to clean req.body before its used to update an event
*/
var cleanPut = function (req, res, next) {
	delete req.body._id;
	delete req.body.owner;
	delete req.body.username;
	delete req.body.socket;
	next();
};

/**
* Express middleware to return a single event, instead of an array of one, if
* username and slug are provided as query parameters (candidate key). 
*/
var makeOneWithUsernameAndSlug = function (req, res, next) {
	if(req.query.username && req.query.slug) {
		return r.single(req, res, r.ensureResult.bind(null, req, res, next));
	}
	next();
};

/**
* Express middleware that ensures the currently authenticated user is allowed to
* edit the event. Requires that the event is at req.params.id. The function is
* conservative; no id, no current user, or unable to get the data it needs, access
* denied. 
*/
var authorizeUpdate = function (req, res, next) {
	if(req.params.id && req.user._id) {
		Event.findOne({ _id: req.params.id, owner: req.user._id }, function (err, event) {
			if(event) {
				next();
			} else {
				debug('forbidding event update, could not find event with that owner');
				next(new errors.ForbiddenError());
			}
		});
	} else {
		debug('forbidding event update, no id or current user id');
		next(new errors.ForbiddenError());
	}
};

module.exports.route = function (app) {

	app.all('/api/events*', r.sanitize);

	app.get('/api/events/:id', r.get);
	app.get('/api/events', r.get, makeOneWithUsernameAndSlug);
	app.post('/api/events', r.auth, cleanPost, r.post);
	app.put('/api/events/:id', r.auth, authorizeUpdate, cleanPut, r.validate, r.put);
	app.delete('/api/events/:id', r.auth, authorizeUpdate, r.del);

	app.all('/api/events*', r.prune, r.flush);
};

