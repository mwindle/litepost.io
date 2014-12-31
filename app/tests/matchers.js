'use strict';

var matchers = {};

matchers.toEqualData = function(expected) {
	return (function compare(actual, expected) {
		// If expected is undefined (not provided to function), return true if
		// actual is also undefined, false otherwise. 
		if(expected === undefined) {
			return actual === undefined;
		}

		// Test if actual is null first since typeof null === 'object' and we don't
		// want to fall into that case here. 
		if(actual === null) {
			return expected === null;
		}

		switch(typeof actual) {
			case 'object':
				// Get the actual and expected properties of the object
				var keys = Object.getOwnPropertyNames(actual);
				var expectedKeys = Object.getOwnPropertyNames(expected);

				// Make sure they have the same number of properties
				if(keys.length !== expectedKeys.length) {
					return false;
				}

				// Iterate over actual keys and recursively compare with expected
				for(var i=0; i<keys.length; i++) {
					if(!compare(actual[keys[i]], expected[keys[i]])) {
						return false;
					}
				}
				break;
			case 'boolean':
			case 'number':
			case 'string':
				if(actual !== expected) {
					return false;
				}
				break;
			default:
				// Ignore Functions, Symbols, and anything else
				break;
		}
		return true;
	})(this.actual, expected);			
};

// Add matchers
beforeEach(function () {
	this.addMatchers(matchers);
});

module.exports = matchers;
