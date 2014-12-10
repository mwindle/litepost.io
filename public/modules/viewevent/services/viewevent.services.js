'use strict';

angular.module('viewevent')

// Service for socket.io
.factory('socket', function ($rootScope) {
  var socket, room;
  return {
    connect: function (rm) {
      room = rm;
      socket = io();
      socket.on('connect', function () {
        socket.emit('join', room);
      });
      if(socket && socket.connected) { socket.emit('join', room); }
    },
    on: function (eventName, callback) {
      if(!socket) { return false; }
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      if(!socket) { return false; }
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if(callback) { callback.apply(socket, args); }
        });
      });
    },
    disconnect: function () {
      if(!socket) { return false; }
      socket.emit('leave', room);
    }
  };
});