'use strict';

/**
 * Module dependencies.
 */
var User = require('mongoose').model('User'),
	Event = require('mongoose').model('Event');

// Get currently authenticated (via session) user
exports.getMe = function (req, res) {
	var user = JSON.parse(JSON.stringify(req.user));
	delete user.password;
	res.json(user);
};

// Get current users events
exports.getMyEvents = function (req, res) {
	Event.find({ 'users.user': req.user._id}, function (err, events) {
		if(err) { return res.send(err); }
		res.json(events);
	});
};
