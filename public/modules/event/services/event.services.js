/*
* Services for viewevent module
*/
(function () {
  'use strict';

  angular.module('event')

  // Service for socket.io Event sockets
  .factory('EventSocket', function (socketFactory) {
    var service = {
      /**
      * Local instance of the wrapped socket
      */
      socket: null,

      /**
      * Room name for the event
      */
      room: null,

      /**
      * Handler for responding to Socket.IO connect events
      */
      connectHandler: function () {
        service.socket.emit('join', service.room);
      },

      /**
      * Custom connect method that automatically joins the provided room
      * and sets up a listener on connect events to do just that. 
      * 
      * @param room {String}
      * 
      */
      connect: function (room, token) {
        // Refuse to connect if no room is provided
        if(!room) { return false; }
        service.room = room;
        
        // Connect to the socket directly with Socket.IO
        var socket = io.connect('', {
          query: token ? 'token='+token : null
        });

        // No point continuing if we couldn't connect
        if(!socket) { return false; }

        // Create and save an 'Angular Wrapped' socket
        service.socket = socketFactory({ioSocket: socket});

        // Listen for the connect event to join the room
        service.socket.on('connect', service.connectHandler);
        
        // Since the connection may have succeeded before we could bind to 
        // that event, check if it's connected now and run the handler
        if(socket && socket.connected) { 
          service.connectHandler();
        }
      },
      
      /**
      * Leaves the room, removes connect listener, resets socket
      * Socket.IO doesn't provide a method for actually disconnecting
      */
      disconnect: function () {
        if(!service.socket) { return false; }
        service.socket.removeAllListeners();
        service.socket.emit('leave', service.room);
        service.socket.disconnect();
        service.socket = service.room = null; 
      },

      /**
      * Pass thru for on method
      */
      on: function (event, callback) {
        if(!service.socket) { return false; }
        service.socket.on.apply(this, arguments);
      },

      /**
      * Pass thru for emit method
      */
      emit: function (event, data, callback) {
        if(!service.socket) { return false; }
        service.socket.emit.apply(this, arguments);
      }

    };
    return service;
  });
})();
