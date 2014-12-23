
var mongoose = require('mongoose');

var EventUserSchema = mongoose.Schema({
	user: { type: mongoose.Schema.ObjectId, ref: 'User' },
	role: { type: String, enum: ['creator', 'admin', 'author'] }
});

var EventSchema = mongoose.Schema({
	name: { 
		type: String, 
		required: true, 
		trim: true,

		// Allow all characters. Must be 3-128 characters long (inclusive). 
		match: /^.{3,128}$/
	},
	channel: { 
		type: String, 
		unique: true, 
		required: true, 
		trim: true,
		lowercase: true,

		// Allow alphanumeric, _ (underscore), and - (dash) characters. Must be 3-32 characters long (inclusive).
		match: /^[a-z0-9_\-]{3,32}$/i
	},
	hidden: { tyoe: Boolean, default: false },
	users: [EventUserSchema],
	start: Date,
	description: {
		type: String,
		trim: true,

		// Allow all characters. Must be less than or equal to 1024 characters long.
		match: /^.{0,1024}$/
	}
});

module.exports = mongoose.model('Event', EventSchema);