'use strict';

/**
 * Module dependencies.
 */
var io = require('socket.io'),
	jwt = require('jsonwebtoken'),
	config = require('./config'),
	emitter = require('./emitter'),
	Event = require('mongoose').model('Event'),
	roomPrefix = 'event:',
	roomPrefixTest = new RegExp('^' + roomPrefix + '.*$');

module.exports = function (server) {

	// Listen to socket connections on the provided server
	io = io.listen(server);

	// Configure sockets for optional authentication
	io.use(function (socket, next) {
		/**
		*	Anyone is authorized to connect, but only those who provide a properly-signed
		* token get the user property set for later authorization use on the socket. 
		*/
		if(socket.handshake.query && socket.handshake.query.token) {
			jwt.verify(socket.handshake.query.token, config.jwtSecret, function (err, decoded) {
				if(!err) {
					socket.handshake.user = decoded;
				}
				next(null, true);
			});
		} else {
			next(null, true);
		}
	});

	// Send newly created messages to all connected clients
	emitter.onNewMessage(function (data) {
		io.to(roomPrefix + data.room).emit('new-message', data.message);
	});

	// Send updated messages to all connected clients
	emitter.onUpdateMessage(function (data) {
		io.to(roomPrefix + data.room).emit('update-message', data.message);
	});

	// Send deleted messages to all connected clients
	emitter.onDeleteMessage(function (data) {
		io.to(roomPrefix + data.room).emit('delete-message', data.message);
	});

	// Handle individual client connections
	io.on('connection', function (socket) {
		var room;

		// Join client to event-specific room
		socket.on('join', function (rm) {
			if(!io.sockets.adapter.rooms[roomPrefix + rm]) {
				Event.findOneBySocket(rm, function (err, event) {
					if(event) {
						socket.join(room = roomPrefix + rm);
					} else {
						socket.disconnect();
					}
				});
			} else {
				socket.join(room = roomPrefix + rm);
			}
		});

		// Remove client from event room
		socket.on('leave', function (rm) {
			socket.leave(room);
			room = null;
		});

		// Event author is typing, inform all clients
		socket.on('typing', function () {
			if(room && socket.handshake.user) { 
				io.to(room).emit('typing', { author: socket.handshake.user }); 
			}
		});

		// Event author stopped typing, inform all clients
		socket.on('stop-typing', function () {
			if(room && socket.handshake.user) { 
				io.to(room).emit('stop-typing'); 
			}
		});

	});

	// Construct metadata object with event stats
	function getEventMeta (channel) {
		return {
			viewers: getNumberOfViewers(channel)
		};
	}

	// Return the number of connected users viewing this event
	function getNumberOfViewers (room) {
		if(room && io.sockets.adapter.rooms[room]) {
			return Math.max(Object.keys(io.sockets.adapter.rooms[room]).length, 1);
		} else {
			return 1;
		}
	}

	// Setup periodic refresh of event metadata to all rooms and clients
	(function refreshEventMeta () {
		setTimeout(function () {
			Object.getOwnPropertyNames(io.sockets.adapter.rooms).forEach(function (room) {
				// Only our custom-prefixed rooms count, socket.io considers each client in its own room
				if(!roomPrefixTest.test(room)) {
					return;
				}
				io.to(room).emit('event-meta-update', getEventMeta(room));
			});
			refreshEventMeta();
		}, 5000);
	})();

};
