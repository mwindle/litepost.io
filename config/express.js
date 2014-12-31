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
	cons = require('consolidate'),
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

	// Passing the request url to environment locals
	app.use(function (req, res, next) {
		res.locals.url = req.protocol + '://' + req.headers.host + req.url;
		next();
	});

	app.engine('html', cons.swig);
	app.set('view engine', 'html');
	app.set('views', path.resolve('./app/views'));
	/**
	* Workaround for consolidate issue #134. 
	* See https://github.com/tj/consolidate.js/commit/e84860d55b2cb938c9a5525f83feba7f86dfeba7#commitcomment-6427166
	*/
	app.locals.cache = 'memory';

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

	// Pass the currently authenticated user to locals
	app.use(function (req, res, next) {
		res.locals.user = req.user;
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
