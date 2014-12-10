'use strict';

/**
 * Module dependencies.
 */
var express = require('express'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	MongoStore = require('connect-mongo')(session),
	helmet = require('helmet'),
	compress = require('compression'),
	passport = require('passport'),
	chalk = require('chalk'),
	path = require('path'),
	config = require('./config');

module.exports = function () {
	var app = express();

	// Setting application local variables
	app.locals.title = config.app.title;
	app.locals.description = config.app.description;
	app.locals.keywords = config.app.keywords;
	app.locals.jsFiles = config.getJavaScriptAssets();
	app.locals.cssFiles = config.getCSSAssets();

	app.set('view engine', 'ejs');
	app.set('views', path.resolve('./app/views'));

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(cookieParser());
	
	app.use(session({
	  secret: config.sessionSecret,
	  store: new MongoStore({
	    url : config.db
	  }),
	  resave: false,
	  saveUninitialized: false
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	
	// Use helmet to secure Express headers
	app.use(helmet.xframe());
	app.use(helmet.xssFilter());
	app.use(helmet.nosniff());
	app.use(helmet.ienoopen());
	app.disable('x-powered-by');

	// Passing the request url to environment locals
	app.use(function(req, res, next) {
		res.locals.url = req.protocol + '://' + req.headers.host + req.url;
		next();
	});

	// Setup response compression, should be placed before express.static
	app.use(compress({
		filter: function(req, res) {
			return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
		},
		level: 9
	}));

	// Setting the app router and static folder
	app.use(express.static(path.resolve('./public')));

	return app;
};
