'use strict';

/**
 * Module dependencies.
 */
var http = require('http'),
	mongoose = require('mongoose'),
	chalk = require('chalk'),
	config = require('./app/config/config'),
	models = require('./app/config/models');

// Initialize the express application
var app = require('./app/config/express')();
var server = http.createServer(app);

// Setup passport config
require('./app/config/passport')();

// Setup Socket.IO config
require('./app/config/socket')(server);

// Setup routes
require('./app/routes/core')(app);
require('./app/routes/api')(app);

// Connect to the MongoDB database 
var db = mongoose.connect(config.db, { server: { auto_reconnect: true } }, function(err) {
	if (err) {
		console.error(chalk.red('Could not connect to MongoDB!'));
		console.log(chalk.red(err));
	} else {
		console.log(chalk.green('Connected to MongoDB'));

		// Start the app
		server.listen(config.port, function() {
			console.log(chalk.green('Express listening on port ' + config.port));
		});
	}
});

// Expose app
exports = module.exports = app;
