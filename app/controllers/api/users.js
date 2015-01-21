'use strict';

/**
 * Module dependencies.
 */
var User = require('mongoose').model('User'),
	errors = require('../../errors/errors'),
 	jwt = require('jsonwebtoken'),
 	config = require('../../../config/config'),
 	emitter = require('../../../config/emitter'),
 	r = require('./rest').model(User),
 	validator = require('validator');

module.exports.pruneUser = function (user, principal) {
		if(!user) {
			return user;
		}

		var u = {};
		u.username = user.username;
		u.name = user.name;
		u.displayName = user.displayName;
		u.emailHash = user.emailHash;
		u.location = user.location;
		u.website = user.website;

		if(principal && principal._id && user._id && principal._id.toString() === user._id.toString()) {
			u.id = user.id;
			u._id = user._id;
			u.email = user.email;
			u.verified = user.verified;
		}
		return u;
};

var prune = function (req, res, next) {
	if(!res.locals.result) {
		return next();
	}

	if(Array.isArray(res.locals.result)) {
		for(var i=0; i<res.locals.result.length; i++) {
			res.locals.result[i] = module.exports.pruneUser(res.locals.result[i]);
		}
	} else {
		res.locals.result = module.exports.pruneUser(res.locals.result, req.user);
	}
	next();
};

var makeOneWithUsernameOrEmail = function (req, res, next) {
	if(req.query.username || req.query.email) {
		r.single(req, res, r.ensureResult.bind(null, req, res, next));
	}
	next();
};

var checkLogin = function (req, res, next) {
	if(!req.body.username || !req.body.password) {
		return next(new errors.InvalidRequestError(' '));
	}
	next();
};

var massageLogin = function (req, res, next) {
	// Start with a pristine req.query
	req.query = {};

	// Copy req.body username/email to query so vanilla r.get can be used
	// Username can have an email or a username
	if(validator.isEmail(req.body.username)) {
		req.query.email = req.body.username;
	} else {
		req.query.username = req.body.username;
	}
	next();
};

var ensureLoginResult = function (req, res, next) {
	if(!res.locals.result) {
		next(new errors.UnauthorizedError());
	} else {
		next();
	}
};

var verifyPassword = function (req, res, next) {
	res.locals.result.comparePassword(req.body.password, function (err, match) {
		if(!match) {
			next(new errors.UnauthorizedError());
		} else {
			next();
		}
	});
};

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
	res.locals.result = { 
		token: token,
		user: module.exports.pruneUser(res.locals.result, res.locals.result)
	};
	next();
};

var meQuery = function (req, res, next) {
	req.params.id = req.user._id;
	req.query = {};
	req.body = {};
	next();
};

var cleanPost = function (req, res, next) {
	// Remove properties that are not settable when creating a user
	delete req.body._id;
	delete req.body.emailHash;
	delete req.body.verified;
	next();
}

var cleanPut = function (req, res, next) {
	// Remove properties that can't be changed directly
	delete req.body._id;
	delete req.body.emailHash;
	delete req.body.verified;

	// Changing these is not currently supported, but should be at some point
	delete req.body.username;
	delete req.body.email;
	delete req.body.password;

	next();
};

var hashPassword = function (req, res, next) {
	if(req.body.password) {
		User.hashPassword(req.body.password, function (err, hashed) {
			if(err) {
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

var authorize = function (req, res, next) {
	if(req.params.id !== req.user._id.toString()) {
		next(new errors.ForbiddenError());
	} else {
		next();
	}
};

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

	app.get('/api/users/:id', r.get, prune);
	app.get('/api/users', r.get, makeOneWithUsernameOrEmail, prune);
	app.post('/api/users', cleanPost, r.post, welcomeNewUser, setToken);
	app.put('/api/users/:id', r.auth, authorize, cleanPut, hashPassword, hashEmail, r.validate, r.put, prune);
	app.delete('/api/users/:id', r.auth, authorize, r.del, prune);
	app.all('/api/users*', r.flush);

	app.post('/api/login', checkLogin, massageLogin, r.get, r.single, ensureLoginResult, verifyPassword, setToken, r.flush);
	app.get('/api/me', r.auth, meQuery, r.get, prune, r.flush);

};
