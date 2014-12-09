'use strict';

/**
 * Module dependencies.
 */
var Event = require('mongoose').model('Event');

// Get an event with the provided id
exports.getEvent = function (req, res) {
	Event.findById(req.params.id, function (err, event) {
		if(err) { return res.send(err); }
		res.json(event);
	});
};

// Get an event with the provided channel
exports.getEventByChannel = function (req, res) {
	Event.findOne({ channel: req.query.channel }, function (err, event) {
		if(err) { res.send(err); }
		res.json(event);
	});
};

// Create a new event
exports.createEvent = function (req, res) {
	new Event({ 
		name: req.body.name,
		channel: req.body.channel, 
		start: req.body.start,
		users: [{
			user: req.user._id,
			role: 'creator'
		}],
		hidden: req.body.hidden,
		description: req.body.description
	}).save(function (err, event) {
		if(err) { return res.send(err); }
		res.json(event); 
	});
};

// Update an existing event
exports.updateEvent = function (req, res) {
	var updated = {};
	if(req.body.hasOwnProperty('name')) { updated.name = req.body.name; }
	if(req.body.hasOwnProperty('start')) { updated.start = req.body.start; }
	if(req.body.hasOwnProperty('hidden')) { updated.hidden = req.body.hidden; }
	if(req.body.hasOwnProperty('description')) { updated.description = req.body.description; }
	Event.findByIdAndUpdate(req.params.id, updated,function (err, event) {
			if(err) { return res.send(err); }
			else {
				res.json(event); 
			}
	});
};

// Delete event with the provided id
exports.deleteEvent = function (req, res) {
	Event.findByIdAndRemove(req.params.id, function (err, event) {
		if(err) { return res.send(err); }
		else { 
			res.json(event); 
		}
	});
};
