'use strict';

/* 
	REST API controller for events model
*/
var User = require('../models/user');
var Event = require('../models/event');
var auth = require('../auth');

module.exports = MeApi;

function MeApi(router) {
	if(!(this instanceof MeApi)) { return new MeApi(router); }
	router.get('/me', auth.ensureAuthenticated, this.getMe.bind(this));
	router.get('/me/events', auth.ensureAuthenticated, this.getMyEvents.bind(this));
}

MeApi.prototype.getMe = function (req, res) {
	var user = JSON.parse(JSON.stringify(req.user));
	delete user.password;
	res.json(user);
};

MeApi.prototype.getMyEvents = function (req, res) {
	Event.find({ 'users.user': req.user._id}, function (err, events) {
		if(err) { return res.send(err); }
		res.json(events);
	});
};
