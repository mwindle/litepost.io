'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
 	User = require('mongoose').model('User');

// Static request to join page
exports.join = function (req, res) {
	res.render('join');
};

// Process join form submission
exports.doJoin = function (req, res) {
	new User( {
		email: req.body.email,
		password: req.body.password
	}).save(function (err, user) {
		if(err && err.code === 11000) {
			return res.render('join', {
				page: 'join',
				email: req.body.email,
				errors: { duplicate: true }
			});
		} else if(err) {
			return res.render('join', {
				page: 'join',
				serverError: true
			});
		} else {
			res.redirect('/app');
		}
	
	});
};

// Static request to login page
exports.login = function (req, res) {
	res.render('login');
};

// Delegate processing of login form submission to passport-local
exports.doLogin = passport.authenticate('local', {
		failureRedirect: '/login',
		successRedirect: '/app'
});

// Logout, destroy session, redirect to home
exports.logout = function (req, res) {
	req.logout();
	req.session.destroy();
	res.redirect('/');
};
