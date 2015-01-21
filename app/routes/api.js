'use strict';

/**
 * Module dependencies.
 */
 var mongoose = require('mongoose'),
 	jwt = require('jsonwebtoken'),
 	User = mongoose.model('User'),
 	Event = mongoose.model('Event'),
 	Message = mongoose.model('Message'),
 	r = require('../controllers/api/rest'),
 	users = require('../controllers/api/users'),
 	events = require('../controllers/api/events'),
 	messages = require('../controllers/api/messages'),
 	config = require('../../config/config'),
	emitter = require('../../config/emitter'),
 	marked = require('marked'),
	markedSetup = require('../../public/js/marked-setup');

module.exports = function (app) {

	app.all('/api*', r.sanitize);

	users(app);
	events(app);
	messages(app);

	app.use(function (err, req, res, next) {
		res.statusCode = err.status;
		res.json(err);
	});

};
