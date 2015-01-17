'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	glob = require('glob'),
	environment = (process.env.NODE_ENV || 'development'),
	overrides = {};

// Production environment has no file-based config, overrides must come from process.env
if(environment !== 'production') {
	overrides = require('./env/' + environment);
} else {
	overrides = process.env;
}

module.exports = _.extend(
	require('./defaults'),
	overrides,
	{ env: environment }
);


/**
 * Get files by glob patterns
 */
module.exports.getGlobbedFiles = function(globPatterns, removeRoot) {
	// For context switching
	var _this = this;

	// URL paths regex
	var urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');

	// The output array
	var output = [];

	// If glob pattern is array so we use each pattern in a recursive way, otherwise we use glob 
	if (_.isArray(globPatterns)) {
		globPatterns.forEach(function(globPattern) {
			output = _.union(output, _this.getGlobbedFiles(globPattern, removeRoot));
		});
	} else if (_.isString(globPatterns)) {
		if (urlRegex.test(globPatterns)) {
			output.push(globPatterns);
		} else {
			var files = glob.sync(globPatterns);
			if (removeRoot) {
				files = files.map(function (file) {
					return file.replace(removeRoot, '');
				});
			}
			output = _.union(output, files);
		}
	}

	return output;
};

/**
 * Get the modules JavaScript files
 */
module.exports.getJavaScriptAssets = function(includeTests) {
	var output;
	if(environment !== 'production') {
		output = this.getGlobbedFiles(this.assets.lib.js.concat(this.assets.js), 'public/');

		// To include tests
		if (includeTests) {
			output = _.union(output, this.getGlobbedFiles(this.assets.tests));
		}
	} else {
		output = ['dist/application.min.js'];
	}
	return output;
};

/**
 * Get the modules CSS files
 */
module.exports.getCSSAssets = function() {
	var output = this.getGlobbedFiles(this.assets.lib.css.concat(this.assets.css), 'public/');
	return output;
};