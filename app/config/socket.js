'use strict';

/**
 * Module dependencies.
 */
var io = require('socket.io'),
	emitter = require('./emitter');

module.exports = function (server) {
	// Listen to socket connections on the provided server
	io = io.listen(server);

	// Send newly created messages to all connected clients
	emitter.on('new-message', function(message) {
		io.to(message.channel).emit('new-message', message);
	});

	// Send updated messages to all connected clients
	emitter.on('update-message', function(message) {
		io.to(message.channel).emit('update-message', message);
	});

	// Send deleted messages to all connected clients
	emitter.on('delete-message', function(message) {
		io.to(message.channel).emit('delete-message', message);
	});

	// Handle individual client connections
	io.on('connection', function(socket) {
		var room;

		// Join client to event-specific room
		socket.on('join', function(rm) {
			socket.join(room = rm);

			// Send client the latest metadata for the event when they join its room
			socket.emit('event-meta-update', getEventMeta(room));
		});

		// Remove client from event room
		socket.on('leave', function(rm) {
			socket.leave(rm);
			room = null;
		});

		// Event author is typing, inform all clients
		socket.on('typing', function() {
			if(room) { io.to(room).emit('typing'); }
		});

		// Event author stopped typing, inform all clients
		socket.on('stop-typing', function() {
			if(room) { io.to(room).emit('stop-typing'); }
		});

		// Setup periodic refresh of event metadata to all clients
		(function refreshEventMeta () {
			setTimeout(function () {
				io.to(room).emit('event-meta-update', getEventMeta(room));
				refreshEventMeta();
			}, 5000);
		})();

	});

	// Construct metadata object with event stats
	function getEventMeta (channel) {
		return {
			viewers: getNumberOfViewers(channel)
		};
	}

	// Return the number of connected users viewing this event
	function getNumberOfViewers (room) {
		if(room && io.nsps['/'].adapter.rooms[room]) {
			return Object.keys(io.nsps['/'].adapter.rooms[room]).length;
		}
	}
};
