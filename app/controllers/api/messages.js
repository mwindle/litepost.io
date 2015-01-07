'use strict';

/**
 * Module dependencies.
 */
var sanitize = require('mongo-sanitize'),
	marked = require('marked'),
	markedSetup = require('../../../public/js/marked-setup'),
	mongoose = require('mongoose'),
	Message = mongoose.model('Message'),
	Event = mongoose.model('Event'),
	emitter = require('../../../config/emitter');

// Get all messages associated with an event channel
exports.getMessages = function(req, res) {
	// Check and sanitize provided event channel
	req.params.channel = sanitize(req.params.channel);
	if(!req.params.channel) {
		res.statusCode = 404;
		return res.json({ error: 'Event not found, invalid channel provided.' });
	}

	Event.findOne({ channel: req.params.channel }, function (err, event) {
		if(err) { 
			res.statusCode = 500;
			return res.json({ error: err.message });
		} else if (!event) {
			res.statusCode = 404;
			return res.json({ error: 'Event not found.' });
		} else {
			Message.find({ event: event }).sort('-sent').exec(function(err, messages) {
				if(err) { 
					res.statusCode = 500;
					return res.json({ error: err.message }); 
				} else {
					return res.json(messages);
				}
			});
		}
	});
};

// Get a message with its id
exports.getMessage = function(req, res) {
	// Sanitize and validity check the required id parameter
	req.params.id = sanitize(req.params.id);
	if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
		res.statusCode = 404;
		return res.json({ error: 'Message not found, invalid id provided.' });
	}

	Message.findById(req.params.id, function(err, message) {
		if(err) { 
			res.statusCode = 500;
			return res.json({ error: err.message });
		} else if(!message) {
			res.statusCode = 404;
			return res.json({ error: 'Message not found.' });
		} else {
			return res.json(message);
		}
	});
};

// Create a new message
exports.createMessage = function(req, res) {
	if(!req.user) {
		res.statusCode = 401;
		return res.json({ error: 'Not authenticated.' });
	}

	// Sanitize inputs against mongo injection
	req.body.event = sanitize(req.body.event);
	if(!mongoose.Types.ObjectId.isValid(req.body.event)) {
		res.statusCode = 404;
		return res.json({ error: 'Event not found, invalid id provided.' });
	}
	req.body.text = sanitize(req.body.text);
	req.body.published = sanitize(req.body.published);

	// Stop immediately if required parameters are not provided
	if(!req.body.event || !req.body.text) {
		res.statusCode = 400;
		return res.json({ error: 'Invalid request, missing event or text' });
	}

	// Fetch event by channel first to ensure it exists
	Event.findById(req.body.event, function (err, event) {
		if(err) { 
			res.statusCode = 500;
			return res.json({ error: err.message });
		} else if (!event) {
			res.statusCode = 400;
			return res.json({ error: 'Invalid event id provided.' });
		} else {
			new Message({ 
				event: req.body.event,
				author: req.user,
				text: req.body.text, 
				html: marked(req.body.text), 
				sent: new Date(),
				published: req.body.published
			}).save(function (err, message) {
				if(err) { 
					if(err.name === 'ValidationError') {
						res.statusCode = 400;
					} else {
						res.statusCode = 500;
					}
					return res.json({ error: err.message }); 
				}	else { 
					// Inform socket clients of newly created message
					emitter.emit('new-message', message);
					return res.json(message); 
				}
			});
		}
	});
};

// Update an existing message 
exports.updateMessage = function(req, res) {
	// Sanitize and validity check the required id parameter
	req.params.id = sanitize(req.params.id);
	if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
		res.statusCode = 404;
		return res.json({ error: 'Message not found, invalid id provided.' });
	}

	var updated = {};
	// Get updated properties individually from req.body and sanitize them
	if(req.body.hasOwnProperty('text')) { updated.text = sanitize(req.body.text); }
	if(req.body.hasOwnProperty('published')) { updated.published = sanitize(req.body.published); }

	if(!updated.text) {
		res.statusCode = 400;
		return res.json({ error: 'Missing required text parameter.' });
	}

	// Run mongoose validation on the text property directly
	Message.schema.path('text').doValidate(updated.text, function (err) {
		// Validation failed, respond with a 400
		if(err) {
			res.statusCode = 400;
			return res.json({ error: err.message });
		}
	});

	// Derived attributes
	updated.html = marked(updated.text);
	updated.updated = new Date();
	
	// Atomically find and update the message
	Message.findByIdAndUpdate(req.params.id, updated, function (err, message) {
		if(err) { 
			if(err.name === 'ValidationError') {
				res.statusCode = 400;
			} else {
				res.statusCode = 500;
			}
			return res.json({ error: err.message });
		} else if (!message) {
			// No message returned means it didn't exist
			res.statusCode = 404;
			return res.json({ error: 'Message not found' });
		} else {
			// Inform socket clients of updated message
			emitter.emit('update-message', message);
			return res.json(message); 
		}
	});
};

// Delete the message with the provided id
exports.deleteMessage = function(req, res) {
	// Sanitize and validity check the required id parameter
	req.params.id = sanitize(req.params.id);
	if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
		res.statusCode = 404;
		return res.json({ error: 'Message not found, invalid id provided.' });
	}

	Message.findByIdAndRemove(req.params.id, function(err, message) {
		if(err) { 
			res.statusCode = 500;
			return res.json({ error: err.message });
		} else if(!message) {
			res.statusCode = 404;
			return res.json({ error: 'Message not found.' });
		}	else { 
			// Inform socket clients of deleted message
			emitter.emit('delete-message', message);
			return res.json(message); 
		}
	});
};
