'use strict';

/**
 * Module dependencies.
 */
var Message = require('mongoose').model('Message'),
	Event = require('mongoose').model('Event'),
	r = require('./rest').model(Message),
	errors = require('../../errors/errors'),
	marked = require('marked'),
	markedSetup = require('../../../public/js/marked-setup'),
	emitter = require('../../../config/emitter'),
	events = require('./events'),
	users = require('./users');

module.exports.pruneMessage = function (message, principal) {
	var m = {};
	m._id = message._id;
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

var prune = function (req, res, next) {
	if(!res.locals.result) {
		return next();
	}

	if(Array.isArray(res.locals.result)) {
		for(var i=0; i<res.locals.result.length; i++) {
			res.locals.result[i] = module.exports.pruneMessage(res.locals.result[i], req.user);
		}
	} else {
		res.locals.result = module.exports.pruneMessage(res.locals.result, req.user);
	}
	next();
};

var clean = function (req, res, next) {
	req.body.author = req.user._id.toString();
	next();
};

var markedRequest = function (req, res, next) {
	req.body.html = marked(req.body.text);
	next();
};

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

var authorizeCreate = function (req, res, next) {
	if(req.body.event) {
		Event.findOne({ _id: req.body.event, owner: req.user._id }, function (err, event) {
			if(!event) {
				next(new errors.ForbiddenError());
			} else {
				next();
			}
		});
	} else {
		next();
	}
};

var authorizeUpdate = function (req, res, next) {
	if(req.params.id) {
		Message.findOne({ _id: req.params.id, author: req.user._id }, function (err, message) {
			if(!message) {
				next(new errors.ForbiddenError());
			} else {
				next();
			}
		});
	} else {
		next();
	}
};

var trimImmutable = function (req, res, next) {
	next();
};

module.exports.route = function (app) {

	app.get('/api/messages/:id', r.get);
	app.get('/api/messages', r.get);
	app.post('/api/messages', r.auth, authorizeCreate, clean, markedRequest, r.post, notifyChange.bind(null, 'newMessage'));
	app.put('/api/messages/:id', r.auth, authorizeUpdate, trimImmutable, markedRequest, r.put, notifyChange.bind(null, 'updateMessage'));
	app.delete('/api/messages/:id', r.auth, authorizeUpdate, r.del, notifyChange.bind(null, 'deleteMessage'));

	app.all('/api/messages*', prune, r.flush);
};

