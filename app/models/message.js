'use strict';


/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	restful = require('node-restful'),
	validator = require('validator');


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
		validate: [
			{
				validator: function (str) {
					return validator.isLength(str, 1, 1000);
				},
				msg: 'Must have a length between [1,1000] characters.'
			}
		]
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
		type: Date,
		default: Date.now
	},
	published: {
		type: Boolean,
		default: false
	}
});

// De-normalized copy of the socket identifier for this event
MessageSchema.virtual('eventSocket').get(function () {
	return this.event;
});
MessageSchema.set('toObject', { virtuals: true });
MessageSchema.set('toJSON', { virtuals: true });

module.exports = restful.model('Message', MessageSchema);
