'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	environment = (process.env.NODE_ENV || 'development');

module.exports = _.extend(
	require('./defaults'),
	require('./env/' + environment),
	{ env: environment }
);