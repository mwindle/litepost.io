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
	m._id = message._id;
	m.id = message.id;
	m.text = message.text;
	m.html = message.html;
	m.sent = message.sent;
	m.updated = message.updated;
	m.eventSocket = message.eventSocket;

	if(message.event && message.event._id) {
		m.event = events.pruneEvent(message.event, principal);
	}
	if(message.author && message.author._id) {
		m.author = users.pruneUser(message.author, principal);
	}
	return m;
};
r.setPruner(module.exports.pruneMessage);

/**
* Express middleware to massage request body to prepare for
* message creation/update. 
*/
var clean = function (req, res, next) {

	req.body.author = req.user._id.toString();
	delete req.body._id;
	delete req.body.html;
	delete req.body.sent;
	delete req.body.updated;
	delete req.body.eventSocket;

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
	if(req.body.event && req.user && req.user._id) {
		Event.findOne({ _id: req.body.event, owner: req.user._id }, function (err, event) {
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
	if(req.params.id && req.user && req.user._id) {
		Message.findOne({ _id: req.params.id, author: req.user._id }, function (err, message) {
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
	app.post('/api/messages', r.auth, authorizeCreate, clean, markedRequest, r.post, notifyChange.bind(null, 'newMessage'));
	app.put('/api/messages/:id', r.auth, authorizeUpdate, clean, markedRequest, r.put, notifyChange.bind(null, 'updateMessage'));
	app.delete('/api/messages/:id', r.auth, authorizeUpdate, r.del, notifyChange.bind(null, 'deleteMessage'));

	app.all('/api/messages*', r.prune, r.flush);
};

