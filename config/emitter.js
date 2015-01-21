'use strict';

/**
 * Module dependencies.
 */
var events = require('events'),
	emitter = new events.EventEmitter();

emitter.onNewMessage = function (cb) {
	emitter.on('new-message', cb);
};
emitter.newMessage = function (socket, message) {
	emitter.emit('new-message', {
		room: socket, 
		message: message
	});
};

emitter.onUpdateMessage = function (cb) {
	emitter.on('update-message', cb);
};
emitter.updateMessage = function (socket, message) {
	emitter.emit('update-message', {
		room: socket, 
		message: message
	});
};

emitter.onDeleteMessage = function (cb) {
	emitter.on('delete-message', cb);
};
emitter.deleteMessage = function (socket, message) {
	emitter.emit('delete-message', {
		room: socket, 
		message: message
	});
};

emitter.onNewUser = function (cb) {
	emitter.on('new-user', cb);
};
emitter.newUser = function (user, emailVerificationToken) {
	var data = {
		user: user,
		verificationToken: emailVerificationToken
	};
	emitter.emit('new-user', data);
};

module.exports = emitter;
