'use strict';

var jwt = require('express-jwt'),
	config = require('./config');

module.exports = function (app) {
	app.use(jwt({
		secret: config.jwtSecret,
		credentialsRequired: false
	}));
};
