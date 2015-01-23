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
	for(var i=0; i<length; i++) {
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
	mocks.tooLongEventName = getStringOfLength(51);

	mocks.tooShortEventChannel = 'aa';
	mocks.tooLongEventChannel = getStringOfLength(31);

	mocks.tooLongEventDescription = getStringOfLength(201);

	mocks.tooLongEventLocation = getStringOfLength(31);

	mocks.tooLongMessageText = getStringOfLength(1001);

	var noop = function () {};
	mocks.emitter = {
		onNewMessage: noop,
		newMessage: noop,
		onUpdateMessage: noop,
		updateMessage: noop,
		onDeleteMessage: noop,
		deleteMessage: noop,
		onNewUser: noop,
		newUser: noop
	};

	beforeEach(function (done) {
		mockgoose.reset();
		done();
	});

	beforeEach(function (done) {
		new User({
			username: 'testvalid',
			email: 'test@valid.com',
			password: 'T3sting'
		}).save(function (err, user) {
			mocks.user = user;
			done();
		});
	});

	beforeEach(function (done) {
		new User({
			username: 'empty',
			email: 'empty@valid.com',
			password: 'T3sting'
		}).save(function (err, user) {
			mocks.emptyUser = user;
			done();
		});
	});

	beforeEach(function (done) {
		mocks.event = new Event({
			name: 'Test Event',
			slug: 'test-event',
			owner: mocks.user._id,
			username: mocks.user.username,
			description: 'Test description',
			location: 'Test location'
		}).save(function (err, event) {
			mocks.event = event;
			done();
		});
	});

	beforeEach(function (done) {
		mocks.message = new Message({
			event: mocks.event,
			author: mocks.user,
			text: 'This is a test message\nwith a newline.',
			html: '<p>This is a test message</p>\n<p>with a newline.</p>',
		}).save(function (err, message) {
			mocks.message = message;
			done();
		});
	});

	/*



	mocks.updatedEvent = new Event({
		name: 'Updated Event Name',
		channel: 'new-channel',
		hidden: true,
		start: new Date(),
		description: 'Updated \n description with \n newlines.',
		location: 'Seattle, WA',
		coverPhoto: 'https://someurl.com/image.png'
	});

	*/

};
