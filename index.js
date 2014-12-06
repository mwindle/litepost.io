'use strict';

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user.js');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoSessionStore = require('connect-mongo')(session);
var config = require('./config');
var emitter = new (require('events').EventEmitter);
var io = require('./socket')(server, emitter);
var api = express.Router();
var meApi = require('./api/me')(api, emitter);
var eventApi = require('./api/events')(api, emitter);
var messageApi = require('./api/messages')(api, emitter);

passport.use(new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password'
},
function(email, password, done) {
	User.findOne({ email: email }, function(err, user) {
		if(err) { return done(err); }
		if(!user) { return done(null, false, { message: 'Invalid email.' }); }
		if(!user.validPassword(password)) { return done(null, false, { message: 'Invalid password.'}); }
		return done(null, user);
	});
}));
passport.serializeUser(function(user, done) {
	done(null, user.id);
});
passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});

app.set('view engine', 'ejs');
app.start = app.listen = function() {
	return server.listen(config.get('port'), function() {
		console.log('Express listening on port ' + config.get('port'));
	});
}
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: config.get('sessionSecret'),
  store: new MongoSessionStore({
    url : config.get('mongoUrl'),
  })
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', api);
['/', '/join', '/login'].forEach(function(route) {
	app.get(route, function(req, res) {
		var url = route.replace('/', '');
		if(req.user && url) { return res.redirect('/app'); }
		res.render(url, { page: url , user: req.user });
	});
});
app.get(/^\/app(\/.*)?$/, function(req, res) {
	res.render('app', { page: 'app', user: req.user });
});
app.get('/logout', function(req, res){
	req.logout();
  req.session.destroy();
  res.redirect('/');
});
app.post('/login', passport.authenticate('local', { 
	failureRedirect: '/login',
	successRedirect: '/app'
}));
app.post('/join', function(req, res) {
	new User({ email: req.body.email, password: User.generateHash(req.body.password) }).save(function(err, user) {
		if(err && err.code === 11000) {
			return res.render('join', { page: 'join', email: req.body.email, errors: { duplicate: true } });
		}
		if(err) { 
			console.log(err); 
			return res.render('join', { page: 'join', serverError: true })
		}
		res.redirect('/app');
	});
});
app.use(express.static('public'));

var db = mongoose.connection;
db.on('connecting', function() {
	console.log('Connecting to MongoDB...');
});
db.on('error', function(error) {
	console.error('Error in MongoDb connection: ' + error);
	mongoose.disconnect();
});
db.on('connected', function() {
	console.log('MongoDB connected!');
});
db.once('open', function() {
	console.log('MongoDB connection opened!');
});
db.on('reconnected', function () {
	console.log('MongoDB reconnected!');
});
db.on('disconnected', function() {
	console.log('MongoDB disconnected!');
	mongoose.connect(config.get('mongoUrl'), { server: { auto_reconnect: true } });
});
mongoose.connect(config.get('mongoUrl'), { server: { auto_reconnect: true } }, function (error) {
	if(error) { return console.error(error); }
	app.start();
});
