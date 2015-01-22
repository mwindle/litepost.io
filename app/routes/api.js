'use strict';


/**
 * Module dependencies.
 */
 var debug = require('debug')('api'),
 	r = require('../controllers/api/rest'),
 	users = require('../controllers/api/users'),
 	events = require('../controllers/api/events'),
 	messages = require('../controllers/api/messages');


module.exports = function (app) {

	app.all('/api*', r.sanitize);

	users.route(app);
	events.route(app);
	messages.route(app);

	/**
	* Express error middleware for catching and sending api errors (404s, 500s, etc)
	* as json responses. 
	*/
	app.use(function (err, req, res, next) {
		if(err && err.status) {
			debug('error handler sending %j', err);
			res.statusCode = err.status;
			res.json(err);
		} else {
			debug('error handler skipping to next()');
			next();
		}
	});

};
