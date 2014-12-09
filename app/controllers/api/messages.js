'use strict';

/**
 * Module dependencies.
 */
var marked = require('marked'),
	markedSetup = require('../../../public/js/marked-setup'),
	Message = require('mongoose').model('Message'),
	emitter = require('../../../config/emitter');

// Get all messages associated with an event channel
exports.getMessages = function(req, res) {
	Message.find({ channel: req.params.channel }).sort('-sent').exec(function(err, messages) {
		if(err) { return res.send(err); }
		res.json(messages);
	});
};

// Get a message with its id
exports.getMessage = function(req, res) {
	Message.findById(req.params.id, function(err, message) {
		if(err) { res.send(err); }
		res.json(message);
	});
};

// Create a new message
exports.createMessage = function(req, res) {
	var message = new Message({ 
		channel: req.body.channel, 
		text: req.body.text, 
		html: marked(req.body.text), 
		sent: new Date() 
	});
	message.save(function(err) {
		if(err) { return res.send(err); }
		else { 
			// Inform socket clients of newly created message
			emitter.emit('new-message', message);
			res.json(message); 
		}
	});
};

// Update an existing message 
exports.updateMessage = function(req, res) {
	Message.findByIdAndUpdate(req.params.id, { 
			text: req.body.text, 
			html: marked(req.body.text)
		}, function(err, message) {
		if(err) { return res.send(err); }
		else {
			// Inform socket clients of updated message
			emitter.emit('update-message', message);
			res.json(message); 
		}
	});
};

// Delete the message with the provided id
exports.deleteMessage = function(req, res) {
	Message.findByIdAndRemove(req.params.id, function(err, message) {
		if(err) { return res.send(err); }
		else { 
			// Inform socket clients of deleted message
			emitter.emit('delete-message', message);
			res.json(message); 
		}
	});
};
