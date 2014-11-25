'use strict';

/* 
	Socket.IO setup
*/
var io = require('socket.io');

module.exports = Socket;

function Socket(server, emitter) {
	if(!(this instanceof Socket)) { return new Socket(server, emitter); }
	this.io = io = io.listen(server);
	emitter.on('new-message', function(message) {
		io.emit('new-message', message);
	});
	emitter.on('update-message', function(message) {
		io.emit('update-message', message);
	});
	emitter.on('delete-message', function(message) {
		io.emit('delete-message', message);
	});
	io.on('connection', function(socket) {
		socket.on('typing', function(channel) {
			io.emit('typing');
		});
		socket.on('stop-typing', function(channel) {
			io.emit('stop-typing');
		})
	});
}

