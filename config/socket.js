'use strict';

/**
 * Module dependencies.
 */
var io = require('socket.io'),
	emitter = require('./emitter'),
	Event = require('mongoose').model('Event');

module.exports = function (server) {
	// Listen to socket connections on the provided server
	io = io.listen(server);

	// Send newly created messages to all connected clients
	emitter.onNewMessage(function(data) {
		io.to(data.room).emit('new-message', data.message);
	});

	// Send updated messages to all connected clients
	emitter.onUpdateMessage(function(data) {
		io.to(data.room).emit('update-message', data.message);
	});

	// Send deleted messages to all connected clients
	emitter.onDeleteMessage(function(data) {
		io.to(data.room).emit('delete-message', data.message);
	});

	// Handle individual client connections
	io.on('connection', function(socket) {
		var room;

		// Join client to event-specific room
		socket.on('join', function(rm) {
			if(!io.nsps['/'].adapter.rooms[rm]) {
				Event.findOneBySocket(rm, function (err, event) {
					if(event) {
						socket.join(room = rm);
				
						// Send client the latest metadata for the event when they join its room
						socket.emit('event-meta-update', getEventMeta(room));
					} else {
						socket.disconnect();
					}
				});
			} else {
				socket.join(room = rm);
				
				// Send client the latest metadata for the event when they join its room
				socket.emit('event-meta-update', getEventMeta(room));
			}
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
			return Math.max(Object.keys(io.nsps['/'].adapter.rooms[room]).length, 1);
		} else {
			return 1;
		}
	}
};
