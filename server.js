'use strict';

/**
 * Module dependencies.
 */
var http = require('http'),
	mongoose = require('mongoose'),
	chalk = require('chalk'),
	config = require('./config/config'),
	models = require('./config/models');

// Initialize the express application
var app = require('./config/express')();
var server = http.createServer(app);

// Setup JWT config
require('./config/jwt')(app);

// Setup Socket.IO config
require('./config/socket')(server);

// Setup email notifications
require('./config/emails')(app);

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
		server.listen(config.PORT, function() {
			console.log(chalk.green('Express listening on port ' + config.PORT));
		});
	}
});

// Expose app
exports = module.exports = app;
