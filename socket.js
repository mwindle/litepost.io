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
		io.to(message.channel).emit('new-message', message);
	});

	emitter.on('update-message', function(message) {
		io.to(message.channel).emit('update-message', message);
	});

	emitter.on('delete-message', function(message) {
		io.to(message.channel).emit('delete-message', message);
	});

	io.on('connection', function(socket) {
		var room;

		socket.on('join', function(rm) {
			socket.join(room = rm);
			socket.emit('event-meta-update', getEventMeta(room));
		});

		socket.on('leave', function(rm) {
			socket.leave(rm);
			room = null;
		});

		socket.on('typing', function() {
			if(room) { io.to(room).emit('typing'); }
		});

		socket.on('stop-typing', function() {
			if(room) { io.to(room).emit('stop-typing'); }
		});

		(function refreshEventMeta () {
			setTimeout(function () {
				io.to(room).emit('event-meta-update', getEventMeta(room));
				refreshEventMeta();
			}, 5000);
		})();

	});

	function getEventMeta (channel) {
		return {
			viewers: getNumberOfViewers(channel)
		};
	}

	function getNumberOfViewers (room) {
		if(room && io.nsps['/'].adapter.rooms[room]) {
			return Object.keys(io.nsps['/'].adapter.rooms[room]).length;
		}
	}
}

