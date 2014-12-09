
var mongoose = require('mongoose');

var EventUserSchema = mongoose.Schema({
	user: { type: mongoose.Schema.ObjectId, ref: 'User' },
	role: { type: String, enum: ['creator', 'admin', 'author'] }
});

var EventSchema = mongoose.Schema({
	name: { type: String, required: true, trim: true },
	channel: { type: String, unique: true, required: true, trim: true },
	hidden: { tyoe: Boolean, default: false },
	users: [EventUserSchema],
	start: Date,
	description: String
});

module.exports = mongoose.model('Event', EventSchema);