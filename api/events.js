'use strict';

/* 
	REST API controller for events model
*/
var Event = require('../models/event');
var auth = require('../auth');

module.exports = EventApi;

function EventApi(router) {
	if(!(this instanceof EventApi)) { return new EventApi(router); }
	router.get('/events/:id', this.getEvent.bind(this));
	router.get('/events', this.getEventByChannel.bind(this));
	router.post('/events', auth.ensureAuthenticated, this.createEvent.bind(this));
	router.post('/events/:id', auth.ensureAuthenticated, this.updateEvent.bind(this));
	router.delete('/events/:id', auth.ensureAuthenticated, this.deleteEvent.bind(this));
}

EventApi.prototype.getEvent = function (req, res) {
	Event.findById(req.params.id, function (err, event) {
		if(err) { return res.send(err); }
		res.json(event);
	});
};

EventApi.prototype.getEventByChannel = function (req, res) {
	Event.findOne({ channel: req.query.channel }, function (err, event) {
		if(err) { res.send(err); }
		res.json(event);
	});
};

EventApi.prototype.createEvent = function (req, res) {
	new Event({ 
		name: req.body.name,
		channel: req.body.channel, 
		start: req.body.start,
		users: [{
			user: req.user._id,
			role: 'creator'
		}],
		hidden: req.body.hidden,
		description: req.body.description
	}).save(function (err, event) {
		if(err) { return res.send(err); }
		res.json(event); 
	});
};

EventApi.prototype.updateEvent = function (req, res) {
	var updated = {};
	if(req.body.hasOwnProperty('name')) { updated.name = req.body.name; }
	if(req.body.hasOwnProperty('start')) { updated.start = req.body.start; }
	if(req.body.hasOwnProperty('hidden')) { updated.hidden = req.body.hidden; }
	if(req.body.hasOwnProperty('description')) { updated.description = req.body.description; }
	Event.findByIdAndUpdate(req.params.id, updated,function (err, event) {
			if(err) { return res.send(err); }
			else {
				res.json(event); 
			}
	});
};

EventApi.prototype.deleteEvent = function (req, res) {
	Event.findByIdAndRemove(req.params.id, function (err, event) {
		if(err) { return res.send(err); }
		else { 
			res.json(event); 
		}
	});
};
