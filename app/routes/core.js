'use strict';

/**
 * Module dependencies.
 */
var accounts = require('../controllers/accounts');

module.exports = function(app) {

	// Static home page
	app.route('/').get(function (req, res) {
		res.render('index');
	});

	// Join (sign up) routes
	app.route('/join').get(accounts.join);
	app.route('/join').post(accounts.doJoin);

	// Login routes
	app.route('/login').get(accounts.login);
	app.route('/login').post(accounts.doLogin);

	// Logs out currently connected user
	app.route('/logout').get(accounts.logout);

	// Routes /app/* to the AngularJS app, the regex lets Angular do its client-side magic
	app.route(/^\/app(\/.*)?$/).get(function (req, res) {
		res.render('app');
	});

};