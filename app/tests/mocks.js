'use strict';

require('../models/user');
require('../models/event');
require('../models/message');
var mongoose = require('mongoose'),
	mockgoose = require('mockgoose'),
	mocks = {};

mockgoose(mongoose);
var User = mongoose.model('User');
var Event = mongoose.model('Event');
var Message = mongoose.model('Message');

module.exports = mocks;

function getStringOfLength(length) {
	var str = '';
	for(var i=0; i<length+1; i++) {
		str += 'a';
	}
	return str;
}

mocks.setup = function () {

	mocks.mongoInjectionValue = { '$gt': '' };
	mocks.nonExistentId = '000000000000000000000000';
	mocks.invalidId = 'invalid';
	mocks.nonExistentChannel = 'dne';
	mocks.invalidChannel = '++invalid++';

	mocks.tooShortEventName = 'aa';
	mocks.tooLongEventName = getStringOfLength(129);

	mocks.tooShortEventChannel = 'aa';
	mocks.tooLongEventChannel = getStringOfLength(33);

	mocks.tooLongEventDescription = getStringOfLength(1025);

	mocks.tooLongMessageText = getStringOfLength(1025);

	beforeEach(function (done) {
		mockgoose.reset();
		done();
	});

	beforeEach(function (done) {
		new User({
			email: 'test@valid.com',
			password: 'testing'
		}).save(function (err, user) {
			mocks.user = user;
			done();
		});
	});

	beforeEach(function (done) {
		mocks.event = new Event({
			name: 'Test Event',
			channel: 'test-event',
			users: [{
				user: mocks.user,
				role: 'creator'
			}],
			start: new Date(),
			description: 'Test description'
		}).save(function (err, event) {
			mocks.event = event;
			done();
		});
	});

	mocks.updatedEvent = new Event({
		name: 'Updated Event Name',
		channel: 'new-channel',
		hidden: true,
		start: new Date(),
		description: 'Updated \n description with \n newlines.'
	});

	beforeEach(function (done) {
		mocks.message = new Message({
			channel: mocks.event.channel,
			text: 'This is a test message\nwith a newline.',
			html: '<p>This is a test message</p>\n<p>with a newline.</p>',
			sent: new Date()
		}).save(function (err, message) {
			mocks.message = message;
			done();
		});
	});

};
