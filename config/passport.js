'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	User = require('mongoose').model('User');
	

module.exports = function() {
	// Serialize sessions
	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	// Deserialize sessions
	passport.deserializeUser(function (id, done) {
		User.findOne({
			_id: id
		}, '-password', function (err, user) {
			done(err, user);
		});
	});

	// Use local strategy
	passport.use(new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
	}, function (email, password, done) {
		User.findOne({ email: email }, function (err, user) {
			if(err) { 
				done(err); 
			} else if(!user) { 
				done(null, false, { message: 'Invalid email.' }); 
			} else {
				user.comparePassword(password, function (err, matched) {
					if(!matched) {
						done(null, false, { message: 'Authentication failed.' });
					} else {
						done(null, user);
					}
				});
			}
		});
	}));

};