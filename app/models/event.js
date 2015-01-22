'use strict';


/**
 * Module dependencies.
 */
var debug = require('debug')('Event'),
	mongoose = require('mongoose'),
	restful = require('node-restful'),
	validator = require('validator');

var EventSchema = mongoose.Schema({
	name: { 
		type: String, 
		required: true, 
		trim: true,
		validate: [
			{
				validator: function (str) {
					return validator.isLength(str, 3, 50);
				},
				msg: 'Must have a length between [3,50] characters.'
			}
		]
	},
	slug: { 
		type: String, 
		required: true, 
		trim: true,
		validate: [
			{
				validator: function (str) {
					return /^[a-z0-9\-]*$/i.test(str);
				},
				msg: 'Must contain only alphanumeric and - characters.'
			},
			{
				validator: function (str) {
					return validator.isLength(str, 3, 60);
				},
				msg: 'Must have a length between [3,60] characters.'
			}
		]
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
		validate: [
			{
				validator: function (str) {
					return validator.isLength(str, 0, 200);
				},
				msg: 'Must have a length between [0,200] characters.'
			}
		]
	},
	location: {
		type: String,
		trim: true,
		validate: [
			{
				validator: function (str) {
					return validator.isLength(str, 0, 30);
				},
				msg: 'Must have a length between [0,30] characters.'
			}
		]
	}
});

// Quick retreival (most common way of getting an event), plus it ensures uniqueness of the tuple
EventSchema.index({ username: 1, slug: 1}, { unique: true });

// Publicly visible identifier for this event's socket connection
EventSchema.virtual('socket').get(function () {
	return this._id;
});
EventSchema.set('toObject', { virtuals: true });
EventSchema.set('toJSON', { virtuals: true });
EventSchema.statics.findOneBySocket = function (socket, cb) {
	return this.findOne({ _id: socket }, cb);
};

module.exports = restful.model('Event', EventSchema);

// Requiring circular dependencies has to be done after export
var Message = require('./message');

// Mongoose middleware to cascade delete to messages within this event
EventSchema.pre('remove', function (next) {
	var event = this;

	Message.remove({ event: event._id }).exec(function (err) {
		if(err) {
			debug('Event remove failed to cascade to Messages: %j', err);
			next(err);
		} else {
			debug('Event remove deleted its messages');
			next();
		}
	});
});
