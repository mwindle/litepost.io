'use strict';

var mongoose = require('mongoose'),
	restful = require('node-restful');

var EventSchema = mongoose.Schema({
	name: { 
		type: String, 
		required: true, 
		trim: true,

		// Allow all characters. Must be 3-50 characters long (inclusive). 
		match: /^[\s\S]{3,50}$/
	},
	slug: { 
		type: String, 
		required: true, 
		trim: true,
		lowercase: true,

		// Allow alphanumeric, _ (underscore), and - (dash) characters. Must be 3-30 characters long (inclusive).
		match: /^[a-z0-9_\-]{3,30}$/i
	},
	owner: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true,
		index: true
	},
	username: {
		type: String,
		required: true
	},
	hidden: { 
		type: Boolean, 
		default: false 
	},
	start: Date,
	description: {
		type: String,
		trim: true,

		// Allow all characters. Must be less than or equal to 200 characters long.
		match: /^[\s\S]{0,200}$/
	},
	location: {
		type: String,
		trim: true,

		// Allow all characters. Must be less than or equal to 30 characters long. 
		match: /^[\s\S]{0,30}$/
	},
	coverPhoto: {
		type: String,
		trim: true
	}
});

// Quick retreival (most common way of getting an event), plus it ensures uniqueness of the tuple
EventSchema.index({ username: 1, slug: 1}, { unique: true });

EventSchema.virtual('socket').get(function () {
	return this._id;
});
EventSchema.set('toObject', { virtuals: true });
EventSchema.set('toJSON', { virtuals: true });
EventSchema.statics.findOneBySocket = function (socket, cb) {
	return this.findOne({ _id: socket }, cb);
};

module.exports = restful.model('Event', EventSchema);
