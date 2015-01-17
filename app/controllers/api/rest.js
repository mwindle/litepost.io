'use strict';

var sanitize = require('mongo-sanitize'),
	errors = require('../../errors/errors'),
	_ = require('lodash'),
	rest = {};

module.exports = rest;

rest.flush = function (req, res, next) {
	res.json(res.locals.result);
};

rest.ensureResult = function (req, res, next) {
	if(!res.locals.result) {
		next(new errors.NotFoundError());
	} else {
		next();
	}
};

rest.auth = function (req, res, next) {
	if(!req.user) {
		next(new errors.UnauthorizedError());
	} else {
		next();
	}
};

rest.mongoCallback = function (res, req, next, err, result) {
	if(err) {
		if(err.name === 'ValidationError') {
			next(new errors.InvalidRequestError(err.message));
		} else {
			next(new errors.ServerError());
		}
	} else if(!result) {
		next(new errors.NotFoundError());
	} else {
		res.locals.result = result;
		next();
	}
};

rest.sanitize = function (req, res, next) {
	//TODO
	next();
};

rest.single = function (req, res, next) {
	if(Array.isArray(res.locals.result)) {
		res.locals.result = res.locals.result[0];
	}
	next();
};

rest.model = function (Model) {
	var r = _.extend({}, rest);

	r.query = function (req, res, next) {
		var query;
		if(req.params.id) {
			query = Model.findById(req.params.id);
		} else {
			var populators = [];
			if(req.query.populate) {
				populators = req.query.populate.split(',');
				delete req.query.populate;
			}
			query = Model.find(req.query);				
			populators.forEach(function (populate) {
				query.populate(populate);
			});
		}

		res.locals.query = query;
		next();
	};

	r.validate = function (req, res, next) {
		var onSchemaError = function (err) {
			if(err) {
				return next(new errors.SchemaValidationError(err));
			}
		};
		for(var property in req.body) {
			if(req.body.hasOwnProperty(property)) {
				var attribute = Model.schema.path(property);
				if(attribute) {
					attribute.doValidate(req.body[property], onSchemaError);
				}
			}
		}
		next();
	};

	r.get = function (req, res, next) {
		r.query(req, res, function () {
			res.locals.query.exec(r.mongoCallback.bind(null, res, req, next));
		});
	};

	r.post = function (req, res, next) {
		// As long as an error doesn't override it, the status should be 201
		res.statusCode = 201;
		new Model(req.body).save(r.mongoCallback.bind(null, res, req, next));
	};

	r.put = function (req, res, next) {
		Model.findByIdAndUpdate(req.params.id, req.body, r.mongoCallback.bind(null, res, req, next));
	};

	r.del = function (req, res, next) {
		Model.findByIdAndRemove(req.params.id, req.body, r.mongoCallback.bind(null, res, req, next));
	};

	return r;
};
