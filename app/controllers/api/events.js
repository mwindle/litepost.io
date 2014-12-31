'use strict';

/**
 * Module dependencies.
 */
var sanitize = require('mongo-sanitize'),
	mongoose = require('mongoose'),
	Event = mongoose.model('Event');

// Get an event with the provided id
exports.getEvent = function (req, res) {
	// Sanitize and validity check the required id parameter
	req.params.id = sanitize(req.params.id);
	if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
		res.statusCode = 404;
		return res.json({ error: 'Event not found, invalid id provided.' });
	}

	Event.findById(req.params.id, function (err, event) {
		if(err) { 
			res.statusCode = 500;
			return res.json({ error: err.message }); 
		} else if (!event) {
			res.statusCode = 404;
			return res.json({ error: 'Event not found.' });
		} else {
			return res.json(event);
		}
	});
};

// Get an event with the provided channel
exports.getEventByChannel = function (req, res) {
	// Sanitize and validity check the required channel parameter
	req.query.channel = sanitize(req.query.channel);
	if(!req.query.channel) {
		res.statusCode = 400;
		return res.json({ error: 'Invalid request, no channel provided.' });
	}
	Event.findOne({ channel: req.query.channel }, function (err, event) {
		if(err) { 
			res.statusCode = 500;
			return res.json({ error: err.message });
		} else if (!event) {
			res.statusCode = 404;
			return res.json({ error: 'Event not found.' });
		} else {
			return res.json(event);
		}
	});
};

// Create a new event
exports.createEvent = function (req, res) {
	// Sanitize inputs against mongo injection
	req.body.name = sanitize(req.body.name);
	req.body.channel = sanitize(req.body.channel);
	req.body.start = sanitize(req.body.start);
	req.body.hidden = sanitize(req.body.hidden);
	req.body.description = sanitize(req.body.description);

	// Stop immediately if required parameters are not provided
	if(!req.body.name || !req.body.channel) {
		res.statusCode = 400;
		return res.json({ error: 'Invalid request, missing name or channel.' });
	}

	// Create a new event and save it
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
		if(err) { 
			if(err.name === 'ValidationError') {
				res.statusCode = 400;
			} else {
				res.statusCode = 500;
			}
			return res.json({ error: err.message }); 
		} else {
			return res.json(event); 
		}
	});
};

// Update an existing event
exports.updateEvent = function (req, res) {
	// Sanitize and validity check the required id parameter
	req.params.id = sanitize(req.params.id);
	if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
		res.statusCode = 404;
		return res.json({ error: 'Event not found, invalid id provided.' });
	}

	var updated = {};
	// Get updated properties individually from req.body and sanitize them
	if(req.body.hasOwnProperty('name')) { updated.name = sanitize(req.body.name); }
	if(req.body.hasOwnProperty('channel')) { updated.channel = sanitize(req.body.channel); }
	if(req.body.hasOwnProperty('start')) { updated.start = sanitize(req.body.start); }
	if(req.body.hasOwnProperty('hidden')) { updated.hidden = sanitize(req.body.hidden); }
	if(req.body.hasOwnProperty('description')) { updated.description = sanitize(req.body.description); }

	/**
	* Manually validate the updated properties since the findByIdAndUpdate method interacts with the
	* Mongo database directly and does not run any of the Mongoose hooks, including validate.
	* See: https://github.com/LearnBoost/mongoose/issues/964
	*/
	Object.getOwnPropertyNames(updated).forEach(function (property) {
		// Run mongoose validation on the property directly
		Event.schema.path(property).doValidate(updated[property], function (err) {
			// Validation failed, respond with a 400
			if(err) {
				res.statusCode = 400;
				return res.json({ error: err.message });
			}
		});
	});

	// Atomically find and update the event
	Event.findByIdAndUpdate(req.params.id, updated, function (err, event) {
		if(err) { 
			if(err.name === 'ValidationError') {
				res.statusCode = 400;
			} else {
				res.statusCode = 500;
			}
			return res.json({ error: err.message });
		} else if (!event) {
			// No event returned means it didn't exist
			res.statusCode = 404;
			return res.json({ error: 'Event not found' });
		} else {
			return res.json(event); 
		}
	});
};

// Delete event with the provided id
exports.deleteEvent = function (req, res) {
	// Sanitize and validity check the required id parameter
	req.params.id = sanitize(req.params.id);
	if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
		res.statusCode = 404;
		return res.json({ error: 'Event not found, invalid id provided.' });
	}

	Event.findByIdAndRemove(req.params.id, function (err, event) {
		if(err) { 
			res.statusCode = 500;
			return res.json({ error: err.message }); 
		} else if(!event) {
			// No event returned means it didn't exist
			res.statusCode = 404;
			return res.json({ error: 'Event not found.' });
		}	else { 
			return res.json(event); 
		}
	});
};
