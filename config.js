
// Private configuration object. Add new attributes as required here. Keys accessed through exported 'get' method.
var config = {
	port: 3000
};

/*
	Load secrets stored seperately from the main configuration. File must have the form:
		
		module.exports = {
			"key": "value",
			...
		};

*/
var secrets = require('./secrets');

// Iterate over secret keys and merge into the main configuration. Has the effect of secret configuration taking precedence. 
var keys = Object.getOwnPropertyNames(secrets);
for(var i=0; i<keys.length; i++) {
	config[keys[i]] = secrets[keys[i]];
}

// Public 'get' method for accessing the read-only configuration. 
module.exports.get = function(key) {
	return config[key];
}