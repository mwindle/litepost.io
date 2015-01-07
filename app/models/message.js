var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
	event: { 
		type: mongoose.Schema.ObjectId, 
		ref: 'Event',
		required: true
	},
	text: {
		type: String,
		required: true,

		// Allow all characters. Must be 1-1024 characters long (inclusive). 
		match: /^[\s\S]{1,1024}$/
	},
	html: {
		type: String,
		required: true
	},
	sent: {
		type: Date,
		required: true,
		default: Date.now
	}
});

module.exports = mongoose.model('Message', MessageSchema);
