'use strict';


/**
 * Module dependencies.
 */
var debug = require('debug')('api'),
	Message = require('mongoose').model('Message'),
	r = require('./rest').model(Message),
	Event = require('mongoose').model('Event'),
	errors = require('../../errors/errors'),
	marked = require('marked'),
	markedSetup = require('../../../public/js/marked-setup'),
	emitter = require('../../../config/emitter'),
	events = require('./events'),
	users = require('./users');


/**
* Prunes the message based on what the principal is allowed to see.
*
* @param {Message} message instance of a Mongoose Message
* @param {User} [principal] currently authenticated user
* @return {object} pruned message
*/
module.exports.pruneMessage = function (message, principal) {
	if(!message) {
		return message;
	}

	var m = {};
	m.id = message.id;
	m.text = message.text;
	m.html = message.html;
	m.sent = message.sent;
	m.updated = message.updated;
	m.eventSocket = message.eventSocket;

	if(message.event && message.event._id) {
		debug('message pruner pruning event');
		m.event = events.pruneEvent(message.event, principal);
	} else {
		m.event = message.event;
	}
	if(message.author && message.author._id) {
		debug('message pruner pruning author');
		m.author = users.pruneUser(message.author, principal);
	} else {
		m.author = message.author;
	}
	return m;
};
r.setPruner(module.exports.pruneMessage);

/**
* Express middleware to ensure post is valid
*/
var checkPost = function (req, res, next) {
	if(!req.body.text || !req.body.event) {
		next(new errors.InvalidRequestError('text and event are required'));
	} else {
		next();
	}
};

/**
* Express middleware to massage request body to prepare for
* message creation/update. 
*/
var clean = function (req, res, next) {
	req.body.author = req.user.id;
	delete req.body._id;
	delete req.body.id;
	delete req.body.html;
	delete req.body.sent;
	delete req.body.updated;
	delete req.body.eventSocket;

	next();
};

/**
*	Express middleware to do additional cleaning for put
*/
var cleanPut = function (req, res, next) {
	delete req.body.event;
	next();
};

/**
* Express middleware to tranlate the message Markdown text
* to req.body.html for later post/put into db. Don't want to 
* use requestor-provided html since it's not secure. 
*/
var markedRequest = function (req, res, next) {
	req.body.html = marked(req.body.text);
	next();
};

/*
* Function that is later bound with pre-loaded type parameter
* so it can be used as Express middleware. Uses the emitter
* to notify subscribers of changes to messages. 
*/
var notifyChange = function (type, req, res, next) {
	// Socket clients require the message author to be populated.
	Message.populate(res.locals.result, { path: 'author' }, function (err, message) {
		if(!message) {
			message = res.locals.result;
		} else {
			res.locals.result = module.exports.pruneMessage(message, req.user);
		}

		emitter[type](res.locals.result.eventSocket, res.locals.result);
		next();
	});
};

/**
* Express middlewhere that ensures the current user is authorized to 
* create a message within an event. 
*/
var authorizeCreate = function (req, res, next) {
	if(req.body.event && req.user && req.user.id) {
		Event.findOne({ _id: req.body.event, owner: req.user.id }, function (err, event) {
			if(!event) {
				next(new errors.ForbiddenError());
			} else {
				next();
			}
		});
	} else {
		next(new errors.ForbiddenError());
	}
};

/**
* Express middleware that ensures the current user is authorized to
* update a message.
*/
var authorizeUpdate = function (req, res, next) {
	if(req.params.id && req.user && req.user.id) {
		Message.findOne({ _id: req.params.id, author: req.user.id }, function (err, message) {
			if(!message) {
				next(new errors.ForbiddenError());
			} else {
				next();
			}
		});
	} else {
		next(new errors.ForbiddenError());
	}
};

module.exports.route = function (app) {

	app.get('/api/messages/:id', r.get);
	app.get('/api/messages', r.get);
	app.post('/api/messages', r.auth, checkPost, authorizeCreate, clean, markedRequest, r.post, notifyChange.bind(null, 'newMessage'));
	app.put('/api/messages/:id', r.auth, authorizeUpdate, clean, cleanPut, markedRequest, r.put, notifyChange.bind(null, 'updateMessage'));
	app.delete('/api/messages/:id', r.auth, authorizeUpdate, r.del, notifyChange.bind(null, 'deleteMessage'));

	app.all('/api/messages*', r.prune, r.flush);
};

