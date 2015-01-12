'use strict';

/**
 * Module dependencies.
 */
 var mongoose = require('mongoose'),
 	User = mongoose.model('User'),
 	Event = mongoose.model('Event'),
 	Message = mongoose.model('Message'),
 	//pruner = require('../controllers/api/pruner'),
	emitter = require('../../config/emitter'),
 	marked = require('marked'),
	markedSetup = require('../../public/js/marked-setup');

module.exports = function (app) {

	//app.route('/api/*').all(auth.ensure);

	User.methods(['get', 'post', 'put', 'delete']);
	//User.after('get', pruner.handler('user'));
	User.after('get', function (req, res, next) {
		if(req.query.username && Array.isArray(res.locals.bundle)) {
			res.locals.bundle = res.locals.bundle[0];
		}
		next();
	});
	User.before('put', function (req, res, next) {
		// Generally not present on user update unless it's changed
		if(req.body.password) {
			User.hashPassword(req.body.password, function (err, hash) {
				if(err) {
					return res.json({ error: 'Internal server error.' });
				}
				req.body.password = hash;
				next();
			});
		}
	});
	User.register(app, '/api/users');

	Event.methods(['get', 'post', 'put', 'delete']);
	//Event.after('get', pruner.handler('event'));
	Event.after('get', function (req, res, next) {
		if(req.query.username && Array.isArray(res.locals.bundle) && res.locals.bundle.length === 1) {
			res.locals.bundle = res.locals.bundle[0];
		}
		next();
	});
	// Set owner, username, and generate a slug
	Event.before('post', function (req, res, next) {
		req.body.owner = req.user._id;
		req.body.username = req.user.username;
		if(!req.body.slug && req.body.name) {
			req.body.slug = req.body.name
				.substring(0, 25)
				.toLowerCase()
				.replace(/[^a-z0-9\-]/g, '-');
		}
		next();
	});
	Event.before('post', function (req, res, next) {
		// Find all events that have the same(ish) slug and auto-rename. 
		// Suseptable to timing issues but only for this user and it's not catastrophic, they'll try again
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
	});
	// Can't be done with Event.before because that doesn't honour changes to req.body
	app.route('/api/events/:id').put(function (req, res, next) {
		// Prevent updates of some fields
		delete req.body.owner;
		delete req.body.username;
		next();
	});
	Event.register(app, '/api/events');

	Message.methods(['get', 'post', 'put', 'delete']);
	var markedRequest = function (req, res, next) {
		req.body.html = marked(req.body.text);
		next();
	};
	app.route('/api/messages').post(markedRequest);
	app.route('/api/messages/:id').put(markedRequest);

	Message.before('post', function (req, res, next) {
		req.body.author = req.user._id.toString();
		next();
	});
	
	var messageNotifyHandler = function (type, req, res, next) {
		if(res.locals.bundle && res.locals.bundle._id) {
			// Socket clients require the message author to be populated. 
			Message.populate(res.locals.bundle, { path: 'author' }, function (err, message) {
				if(!message) {
					message = res.locals.bundle;
				}
				/**
				*	Only sending the message if the it's published. 
				* This has a side-effect that if the message was previously published and the 
				* update is moving it to un-published, socket clients will not get the update. 
				*/
				// TODO: Only emit if message.published
				// TODO: Prune message with no principal to send only public fields
				emitter[type](res.locals.bundle.eventSocket, res.locals.bundle);//pruner.message(null, res.locals.bundle));
				next();
			});
		} else {
			next();
		}
	};
	Message.after('post', messageNotifyHandler.bind(null, 'newMessage'));
	Message.after('put', messageNotifyHandler.bind(null, 'updateMessage'));
	Message.after('delete', messageNotifyHandler.bind(null, 'deleteMessage'));
		// Can't be done with Message.before because that doesn't honour changes to req.body
	app.route('/api/messages/:id').put(function (req, res, next) {
		// Prevent updates of these immutable fields in case they've been populated
		delete req.body.sent;
		delete req.body.author;
		delete req.body.event;
		next();
	});
	Message.register(app, '/api/messages');

};
