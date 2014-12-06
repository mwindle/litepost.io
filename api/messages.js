'use strict';

/* 
	REST API controller for messages model
*/
var Message = require('../models/message');
var auth = require('../auth');
var marked = require('marked');
require('../public/js/marked-setup');

module.exports = MessageApi;

function MessageApi(router, emitter) {
	if(!(this instanceof MessageApi)) { return new MessageApi(router, emitter); }
	this.emitter = emitter;
	router.get('/events/:channel/messages', this.getMessages.bind(this));
	router.get('/events/:channel/messages/:id', this.getMessage.bind(this));
	router.post('/events/:channel/messages', auth.ensureAuthenticated, this.createMessage.bind(this));
	router.post('/events/:channel/messages/:id', auth.ensureAuthenticated, this.updateMessage.bind(this));
	router.delete('/events/:channel/messages/:id', auth.ensureAuthenticated, this.deleteMessage.bind(this));
}

MessageApi.prototype.getMessages = function(req, res) {
	Message.find({ channel: req.params.channel }).sort('-sent').exec(function(err, messages) {
		if(err) { return res.send(err); }
		res.json(messages);
	});
};

MessageApi.prototype.getMessage = function(req, res) {
	Message.findById(req.params.id, function(err, message) {
		if(err) { res.send(err); }
		res.json(message);
	});
};

MessageApi.prototype.createMessage = function(req, res) {
	var message = new Message({ 
		channel: req.body.channel, 
		text: req.body.text, 
		html: marked(req.body.text), 
		sent: new Date() 
	});
	var that = this;
	message.save(function(err) {
		if(err) { return res.send(err); }
		else { 
			that.emitter.emit('new-message', message);
			res.json(message); 
		}
	});
};

MessageApi.prototype.updateMessage = function(req, res) {
	var that = this;
	Message.findByIdAndUpdate(req.params.id, { 
			text: req.body.text, 
			html: marked(req.body.text)
		}, function(err, message) {
		if(err) { return res.send(err); }
		else {
			that.emitter.emit('update-message', message);
			res.json(message); 
		}
	});
};

MessageApi.prototype.deleteMessage = function(req, res) {
	var that = this;
	Message.findByIdAndRemove(req.params.id, function(err, message) {
		if(err) { return res.send(err); }
		else { 
			that.emitter.emit('delete-message', message);
			res.json(message); 
		}
	});
};
