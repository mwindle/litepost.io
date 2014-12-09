var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
	channel: String,
	text: String,
	html: String,
	sent: Date
});

module.exports = mongoose.model('Message', MessageSchema);