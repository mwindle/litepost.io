
var mongoose = require('mongoose');

var EventUserSchema = mongoose.Schema({
	user: { type: mongoose.Schema.ObjectId, ref: 'User' },
	role: { type: String, enum: ['creator', 'admin', 'author'] }
});

var EventSchema = mongoose.Schema({
	name: String,
	channel: { type: String, unique: true },
	users: [EventUserSchema],
	css: String
});

module.exports = mongoose.model('Event', EventSchema);