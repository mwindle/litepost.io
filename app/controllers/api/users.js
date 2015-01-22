'use strict';


/**
 * Module dependencies.
 */
var debug = require('debug')('api'),
	User = require('mongoose').model('User'),
 	r = require('./rest').model(User),
	errors = require('../../errors/errors'),
 	jwt = require('jsonwebtoken'),
 	config = require('../../../config/config'),
 	emitter = require('../../../config/emitter'),
 	validator = require('validator');

/**
* Prunes the user based on what the principal is allowed to see.
*
* @param {User} user instance of a Mongoose User
* @param {User} [principal] currently authenticated user
* @return {object} pruned user
*/
module.exports.pruneUser = function (user, principal) {
		if(!user) {
			return user;
		}

		var u = {};
		u._id = user._id;
		u.id = user.id;
		u.username = user.username;
		u.name = user.name;
		u.displayName = user.displayName;
		u.emailHash = user.emailHash;
		u.location = user.location;
		u.website = user.website;

		if(principal && principal._id && user._id && principal._id.toString() === user._id.toString()) {
			u.email = user.email;
			u.verified = user.verified;
		}
		return u;
};
r.setPruner(module.exports.pruneUser);

/**
* Express middleware to return a single user, instead of an array of one, if
* username or email are provided as query parameters (candidate keys). 
*/
var makeOneWithUsernameOrEmail = function (req, res, next) {
	if(req.query.username || req.query.email) {
		r.single(req, res, r.ensureResult.bind(null, req, res, next));
	}
	next();
};

/**
* Express middleware to setup request parameters to prepare them for getting one
* user and checking their password. 
*/
var massageLogin = function (req, res, next) {
	if(!req.body.username || !req.body.password) {
		debug('invalid login request');
		return next(new errors.InvalidRequestError());
	}
	// Start with a pristine req.query
	req.query = {};

	// Copy req.body username/email to query so vanilla r.get can be used
	// Username can have an email or a username
	if(validator.isEmail(req.body.username)) {
		debug('logging in with email');
		req.query.email = req.body.username;
	} else {
		debug('logging in with username');
		req.query.username = req.body.username;
	}
	next();
};

/**
* Express middleware that throws the appropriate error if couldn't find a user 
* to authenticate against
*/
var ensureLoginResult = function (req, res, next) {
	if(!res.locals.result) {
		debug('triggering UnauthorizedError');
		next(new errors.UnauthorizedError());
	} else {
		next();
	}
};

/**
* Express middleware to verifiy the password against the fetched user. 
*/
var verifyPassword = function (req, res, next) {
	res.locals.result.comparePassword(req.body.password, function (err, match) {
		if(!match) {
			debug('passwords did not match, triggering UnauthorizedError');
			next(new errors.UnauthorizedError());
		} else {
			next();
		}
	});
};

/**
* Express middleware that generates a JWT with res.locals.result user.
*/
var setToken = function (req, res, next) {
	var token = jwt.sign({
		_id: res.locals.result._id,
		username: res.locals.result.username,
		name: res.locals.result.name,
		displayName: res.locals.result.displayName
	}, config.jwtSecret, 
	{
		expiresInMinutes: config.jwtLifetimeInMin
	});
	debug('generated token ' + token);
	res.locals.result = { 
		token: token,
		user: module.exports.pruneUser(res.locals.result, res.locals.result)
	};
	next();
};

/**
* Set request parameters to get currently authenticated user
*/
var meQuery = function (req, res, next) {
	req.params.id = req.user._id;
	req.query = {};
	req.body = {};
	next();
};

/**
* Remove properties that are not settable when creating a user
*/
var cleanPost = function (req, res, next) {
	
	delete req.body._id;
	delete req.body.emailHash;
	delete req.body.verified;
	next();
};

/**
*	Remove properties that can't be changed directly
*/
var cleanPut = function (req, res, next) {
	delete req.body._id;
	delete req.body.emailHash;
	delete req.body.verified;

	// Changing these is not currently supported, but should be at some point
	delete req.body.username;
	delete req.body.email;
	delete req.body.password;

	next();
};

/**
* Hash the password in the request parameters 
*/
var hashPassword = function (req, res, next) {
	if(req.body.password) {
		User.hashPassword(req.body.password, function (err, hashed) {
			if(err) {
				debug('unable to hash password %j', err);
				next(new errors.ServerError());
			} else {
				req.body.password = hashed;
				next();
			}
		});
	} else {
		next();
	}
};

/**
* Generate the derived emailHash user property and set in request
*/
var hashEmail = function (req, res, next) {
	if(req.body.email) {
		User.hashEmail(req.body.email, function (err, hashed) {
			if(err) {
				next(new errors.ServerError());
			} else {
				req.body.emailHash = hashed;
				next();
			}
		});
	} else {
		next();
	}
};

/**
* Ensure the current user is allowed to edit this user
*/
var authorize = function (req, res, next) {
	if(req.params.id !== req.user._id.toString()) {
		debug('User %s is not authorized to change user %s', req.user._id, req.params.id);
		next(new errors.ForbiddenError());
	} else {
		next();
	}
};

/**
* Generate email verification link and emit an event with the details
*/
var welcomeNewUser = function (req, res, next) {
	var emailVerificationToken = jwt.sign({
		_id: res.locals.result._id,
		currentEmail: res.locals.result.email,
		newEmail: res.locals.result.email
	}, config.jwtSecret, 
	{
		expiresInMinutes: config.jwtLifetimeInMin
	});
	emitter.newUser(res.locals.result, emailVerificationToken);
	next();
};



module.exports.route = function (app) {

	app.get('/api/users/:id', r.get, r.prune);
	app.get('/api/users', r.get, makeOneWithUsernameOrEmail, r.prune);
	app.post('/api/users', cleanPost, r.post, welcomeNewUser, setToken);
	app.put('/api/users/:id', r.auth, authorize, cleanPut, hashPassword, hashEmail, r.validate, r.put, r.prune);
	app.delete('/api/users/:id', r.auth, authorize, r.del, r.prune);
	app.all('/api/users*', r.flush);

	app.post('/api/login', massageLogin, r.get, r.single, ensureLoginResult, verifyPassword, setToken, r.flush);
	app.get('/api/me', r.auth, meQuery, r.get, r.prune, r.flush);

};
