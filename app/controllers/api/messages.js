'use strict';

/**
 * Module dependencies.
 */
var Message = require('mongoose').model('Message'),
	r = require('./rest').model(Message),
	marked = require('marked'),
	markedSetup = require('../../../public/js/marked-setup'),
	emitter = require('../../../config/emitter');

var prune = function (req, res, next) {
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
			res.locals.result = message;
		}

		emitter[type](res.locals.result.eventSocket, res.locals.result);
		next();
	});
};

var trimImmutable = function (req, res, next) {
	next();
};

module.exports = function (app) {

	app.get('/api/messages/:id', r.get);
	app.get('/api/messages', r.get);
	app.post('/api/messages', clean, markedRequest, r.post, notifyChange.bind(null, 'newMessage'));
	app.put('/api/messages/:id', r.auth, trimImmutable, markedRequest, r.put, notifyChange.bind(null, 'updateMessage'));
	app.delete('/api/messages/:id', r.auth, r.del, notifyChange.bind(null, 'deleteMessage'));

	app.all('/api/messages*', prune, r.flush);
};

