'use strict';


/**
 * Module dependencies.
 */
var debug = require('debug')('rest'),
	sanitize = require('mongo-sanitize'),
	errors = require('../../errors/errors'),
	_ = require('lodash'),
	rest = {};

/**
* Module exports
*/
module.exports = rest;


/**
* Express middleware to flush result data from res.locals.result back to the client as json.
*/
rest.flush = function (req, res, next) {
	debug('Flushing %j', res.locals.result);
	res.json(res.locals.result);
};


/**
* Express middleware to ensure a result is present at res.locals.result.
* Triggers error pipeline with NotFoundError if no result present.
*/
rest.ensureResult = function (req, res, next) {
	if(!res.locals.result) {
		debug('ensureResult triggering NotFoundError');
		next(new errors.NotFoundError());
	} else {
		next();
	}
};

/**
* Express middleware to ensure a current user is present at req.user.
* Triggers error pipeline with UnauthorizedError if no user present. 
*/
rest.auth = function (req, res, next) {
	if(!req.user || !req.user.id) {
		debug('auth triggering UnauthorizedError');
		next(new errors.UnauthorizedError());
	} else {
		next();
	}
};

/**
* Express middleware to sanitize request data against MongoDB injection.
* Doesn't explicitly throw any errors. 
*/
rest.sanitize = function (req, res, next) {
	debug('request parameters before sanitize:');
	debug('params: %j', req.params);
	debug('body: %j', req.body);
	debug('query: %j', req.query);

	req.parms = sanitize(req.params);
	req.body = sanitize(req.body);
	req.query = sanitize(req.query);

	debug('request parameters after sanitize:');
	debug('params: %j', req.params);
	debug('body: %j', req.body);
	debug('query: %j', req.query);

	next();
};

/**
* Express middleware to convert any result present at res.locals.result to
* a single value rather than an array. If multiple elements are present, the
* first will be used and the rest will be discarded. Does nothing if the result
* is not an array. If the result is an empty array, throw an error. 
*/
rest.single = function (req, res, next) {
	if(Array.isArray(res.locals.result)) {
		if(!res.locals.result.length) {
			debug('rest.single sending 404');
			next(new errors.NotFoundError());
		} else {
			debug('truncating result of length ' + res.locals.result.length + ' to single object');
			res.locals.result = res.locals.result[0];
		}
	}
	next();
};

/**
* Callback used to bind as Express middleware to handle the response
* of a Mongoose database operation. Must not be used as middleware directly.
* 
* Eg: Model.query().exec(mongoCallback.bind(null, req, res, next));
*/
var mongoCallback = function (req, res, next, err, result) {
	if(err) {
		if(err.name === 'ValidationError') {
			debug('mongoCallback triggering SchemaValidationError');
			next(new errors.SchemaValidationError(err.errors));
		} else if(err.code === 11000) {
			// Failed unique constraint, err doesn't include the specific path failure
			debug('failed unique constraint of model %j', err);
			next(new errors.SchemaValidationError());
		} else {
			debug('mongo error %j', err);
			next(new errors.ServerError());
		}
	} else if(!result) {
		debug('mongoCallback triggering NotFoundError');
		next(new errors.NotFoundError());
	} else {
		res.locals.result = result;
		next();
	}
};

/*
* Binds a new rest object against a specific Mongoose model, attaching
* all utility functions and Model-specific get, post, put, and query methods. 
* Accepts an optional pruner function that will be use if the prune utility
* middleware is used. If provided, pruner must be a valid function that accepts
* an instance of Model and principal (req.user), returning an updated object
* that is safe to return to the provided principal. 
* 
* @param {Mongoose.Model} Model
* @param [{function}] pruner
* @return {rest} r
*/
rest.model = function (Model, pruner) {
	var r = _.extend({}, rest);

	/**
	* Convienience function for setting pruner after binding model
	*/
	r.setPruner = function (pruner) {
		if('function' === typeof pruner) {
			r.pruner = pruner;
		}
	};
	r.setPruner(pruner);

	/*
	* Express middleware to inspect the request paramters and create a
	* Mongoose query at res.locals.query. Supports finding one or many, 
	* and allows for populating sub-documents when req.query has a populate 
	* key as follows: ../url/resources?populate=subDocAttribute[,anotherSubDocAttribute]*
	*/
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

	/*
	* Express middleware that runs Mongoose validation (middleware) for the properties that
	* exist in the req.body. 
	* Triggers a SchemaValidationError with all errors detected. If no errors are found, 
	* it continues on to the next() middleware. Extra properties in req.body that are not present
	* in the Model will be ignored. 
	*/
	r.validate = function (req, res, next) {
		var errs = [];
		var onSchemaError = function (err) {
			if(err) {
				errs.push(err);
			}
		};
		for(var property in req.body) {
			if(req.body.hasOwnProperty(property)) {
				var attribute = Model.schema.path(property);
				if(attribute) {
					// The callback is actually sync
					attribute.doValidate(req.body[property], onSchemaError);
				}
			}
		}
		if(errs.length) {
			debug('schema validation failed %j', errs);
			next(new errors.SchemaValidationError(errs));
		} else {
			next();
		}
	};

	/**
	*	Express middleware to get one or more Model documents from Mongo
	* based on the criteria in the request. Saves successful results to
	* res.locals.result. No results trigger a NotFoundError, and any errors
	* returned from the query trigger a ServerError. 
	*/
	r.get = function (req, res, next) {
		r.query(req, res, function () {
			res.locals.query.exec(mongoCallback.bind(null, req, res, next));
		});
	};

	/**
	* Express middleware to create a new document for the Model. Document
	* properties must be present in req.body. Uses Mongoose's save method
	* which runs all pre/post middleware, including validators. Successful
	* results are put to res.locals.result with a statusCode of 201.
	*/
	r.post = function (req, res, next) {
		debug('creating document with data %j', req.body);
		// As long as an error doesn't override it, the status should be 201
		res.statusCode = 201;
		new Model(req.body).save(mongoCallback.bind(null, req, res, next));
	};

	/**
	* Express middleware to update an existing document for the Model. Document
	* _id must be present at req.params.id and updated properties at req.body. 
	* Uses the atomic findByIdAndUpdate method which DOES NOT use Mongoose middleware,
	* including validators. The validate method should be used before this method
	* to ensure updated properties are valid. Puts a successful result at 
	* res.locals.result or triggers appropriate error. 
	*/
	r.put = function (req, res, next) {
		if(!req.params.id) {
			debug('put called without req.params.id');
			next(new errors.NotFoundError());
		} else {
			debug('updating document %s with %j', req.params.id, req.body);
			Model.findByIdAndUpdate(req.params.id, req.body, mongoCallback.bind(null, req, res, next));
		}
	};

	/**
	* Express middleware to delete a document for the Model. Document _id must be
	* present at req.params.id. Doesn't use the atomic delete operation. Instead, 
	* it first fetches the document to delete then calls remove() which runs Mongoose
	* middleware. 
	*/
	r.del = function (req, res, next) {
		// Get the document first so the remove() method and associated middleware can be used
		r.get(req, res, function () {
			res.locals.result.remove(mongoCallback.bind(null, req, res, next));
		});
	};

	/**
	* Express middleware that uses the configured pruner function (if provided) to 
	* trim any result data present at res.locals.result. If no pruner is configured,
	* this will clobber all results. 
	*/
	r.prune = function (req, res, next) {
		if(!res.locals.result) {
			debug('skip prune cause no result');
			return next();
		}

		if('function' !== typeof r.pruner) {
			debug('prune clobbering result since no pruner defined');
			res.locals.result = null;
			return next();
		}

		if(Array.isArray(res.locals.result)) {
			for(var i=0; i<res.locals.result.length; i++) {
				res.locals.result[i] = r.pruner(res.locals.result[i], req.user);
			}
		} else {
			res.locals.result = r.pruner(res.locals.result, req.user);
		}
		next();
	};

	return r;
};
