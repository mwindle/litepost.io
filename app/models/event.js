
var mongoose = require('mongoose');

var EventUserSchema = mongoose.Schema({
	user: { 
		type: mongoose.Schema.ObjectId, 
		ref: 'User' 
	},
	role: { 
		type: String, 
		required: true,
		enum: ['creator', 'admin', 'author'] 
	}
});

var EventSchema = mongoose.Schema({
	name: { 
		type: String, 
		required: true, 
		trim: true,

		// Allow all characters. Must be 3-50 characters long (inclusive). 
		match: /^[\s\S]{3,50}$/
	},
	channel: { 
		type: String, 
		unique: true, 
		required: true, 
		trim: true,
		lowercase: true,

		// Allow alphanumeric, _ (underscore), and - (dash) characters. Must be 3-30 characters long (inclusive).
		match: /^[a-z0-9_\-]{3,30}$/i
	},
	hidden: { 
		type: Boolean, 
		default: false 
	},
	users: [EventUserSchema],
	start: Date,
	description: {
		type: String,
		trim: true,

		// Allow all characters. Must be less than or equal to 200 characters long.
		match: /^[\s\S]{0,200}$/
	}
});

module.exports = mongoose.model('Event', EventSchema);