'use strict';

/* 
	REST API controller for messages model
*/
var Message = require('../models/message.js');
var marked = require('marked');
marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

module.exports = MessageApi;

function MessageApi(router, emitter) {
	if(!(this instanceof MessageApi)) { return new MessageApi(router, emitter); }
	this.emitter = emitter;
	router.get('/messages', this.getMessages.bind(this));
	router.post('/messages', this.createMessage.bind(this));
	router.post('/messages/:id', this.updateMessage.bind(this));
	router.delete('/messages/:id', this.deleteMessage.bind(this));
}

MessageApi.prototype.getMessages = function(req, res) {
	Message.find().sort('-sent').exec(function(err, messages) {
		if(err) { res.send(err); }
		res.json(messages);
	});
}

MessageApi.prototype.createMessage = function(req, res) {
	var message = new Message({ 
		channel: req.body.channel, 
		text: req.body.text, 
		html: marked(req.body.text), 
		sent: new Date() 
	});
	var that = this;
	message.save(function(err) {
		if(err) { res.send(err); }
		else { 
			that.emitter.emit('new-message', message);
			res.json(message); 
		}
	});
}

MessageApi.prototype.updateMessage = function(req, res) {
	var that = this;
	Message.findByIdAndUpdate(req.params.id, { 
			text: req.body.text, 
			html: marked(req.body.text)
		}, function(err, message) {
		if(err) { res.send(err); }
		else {
			that.emitter.emit('update-message', message);
			res.json(message); 
		}
	});
}

MessageApi.prototype.deleteMessage = function(req, res) {
	var that = this;
	Message.findByIdAndRemove(req.params.id, function(err, message) {
		if(err) { res.send(err); }
		else { 
			that.emitter.emit('delete-message', message);
			res.json(message); 
		}
	});
}