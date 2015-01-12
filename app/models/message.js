'use strict';

var mongoose = require('mongoose'),
	restful = require('node-restful');

var MessageSchema = new mongoose.Schema({
	event: {
		type: mongoose.Schema.ObjectId,
		ref: 'Event',
		required: true
	},
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true
	},
	text: {
		type: String,
		required: true,

		// Allow all characters. Must be 1-1000 characters long (inclusive). 
		match: /^[\s\S]{1,1000}$/
	},
	html: {
		type: String,
		required: true
	},
	sent: {
		type: Date,
		required: true,
		default: Date.now
	},
	updated: {
		type: Date
	},
	published: {
		type: Boolean,
		default: false
	}
});

MessageSchema.virtual('eventSocket').get(function () {
	return this.event;
});
MessageSchema.set('toObject', { virtuals: true });
MessageSchema.set('toJSON', { virtuals: true });

module.exports = restful.model('Message', MessageSchema);
