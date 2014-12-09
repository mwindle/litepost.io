'use strict';

/**
 * Module dependencies.
 */
 var events = require('../controllers/api/events'),
 	messages = require('../controllers/api/messages'),
 	users = require('../controllers/api/users');

module.exports = function (app) {

	// REST API for events resource
	app.route('/api/events:id').get(events.getEvent);
	app.route('/api/events').get(events.getEventByChannel);
	app.route('/api/events').post(events.createEvent);
	app.route('/api/events/:id').post(events.updateEvent);
	app.route('/api/events/:id').delete(events.deleteEvent);

	// REST API for message resource
	app.route('/api/events/:channel/messages').get(messages.getMessages);
	app.route('/api/events/:channel/messages/:id').get(messages.getMessage);
	app.route('/api/events/:channel/messages').post(messages.createMessage);
	app.route('/api/events/:channel/messages/:id').post(messages.updateMessage);
	app.route('/api/events/:channel/messages/:id').delete(messages.deleteMessage);

	// REST API for currently authenticated (via session) user
	app.route('/api/me').get(users.getMe);
	app.route('/api/me/events').get(users.getMyEvents);

};
