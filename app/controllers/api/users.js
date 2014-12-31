'use strict';

/**
 * Module dependencies.
 */
var User = require('mongoose').model('User'),
	Event = require('mongoose').model('Event');

// Get currently authenticated (via session) user
exports.getMe = function (req, res) {
	if(!req.user) {
		res.statusCode = 401;
		return res.json({ error: 'Not authenticated.' });
	}

	// Stringify then parse the req.user object to get a deep clone of it
	var user = JSON.parse(JSON.stringify(req.user));
	// Remove the password from the cloned user object
	delete user.password;
	return res.json(user);
};

// Get current users events
exports.getMyEvents = function (req, res) {
	if(!req.user) {
		res.statusCode = 401;
		return res.json({ error: 'Not authenticated.' });
	}

	Event.find({ 'users.user': req.user._id}, function (err, events) {
		if(err) { 
			res.statusCode = 500;
			return res.json({ error: err.message }); 
		} else {
			return res.json(events);
		}
	});
};
