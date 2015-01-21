'use strict';

/**
 * Module dependencies.
 */
var User = require('mongoose').model('User'),
	errors = require('../../errors/errors'),
 	jwt = require('jsonwebtoken'),
 	config = require('../../../config/config'), 
 	r = require('./rest').model(User),
 	validator = require('validator');


var prune = function (req, res, next) {
	if(!res.locals.result) {
		return next();
	}
	var p = function (user) {
		if('function' === typeof user.toObject) {
			user = user.toObject();
		}
		delete user.password;
		return user;
	};

	if(Array.isArray(res.locals.result)) {
		for(var i=0; i<res.locals.result.length; i++) {
			res.locals.result[i] = p(res.locals.result[i]);
		}
	} else {
		res.locals.result = p(res.locals.result);
	}
	next();
};

var makeOneWithUsername = function (req, res, next) {
	if(req.query.username) {
		r.single(req, res, r.ensureResult.bind(null, req, res, next));
	}
	next();
};

var makeOneWithEmail = function (req, res, next) {
	if(req.query.email) {
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

	// Copy req.body username/email to query so vanilla get can be used
	// Username can have an email or a username
	if(validator.isEmail(req.body.username)) {
		req.query.email = req.body.username;
	} else {
		req.query.username = req.body.username;
	}
	next();
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
		user: res.locals.result
	};
	next();
};

var meQuery = function (req, res, next) {
	req.params.id = req.user._id;
	req.query = {};
	req.body = {};
	next();
};

var clean = function (req, res, next) {
	//TODO
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

module.exports = function (app) {

	app.get('/api/users/:id', r.get);
	app.get('/api/users', r.get, makeOneWithUsername, makeOneWithEmail);
	app.post('/api/users', clean, r.post, setToken);
	app.put('/api/users/:id', r.auth, authorize, clean, hashPassword, hashEmail, r.validate, r.put);
	app.delete('/api/users/:id', r.auth, authorize, r.del);
	app.all('/api/users*', prune, r.flush);

	app.post('/api/login', checkLogin, massageLogin, r.get, r.single, verifyPassword, prune, setToken, r.flush);
	app.get('/api/me', r.auth, meQuery, r.get, prune, r.flush);

};
