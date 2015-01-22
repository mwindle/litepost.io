'use strict';

var debug = require('debug')('User'),
	mongoose = require('mongoose'),
	restful = require('node-restful'),
	bcrypt = require('bcrypt'),
	crypto = require('crypto'),
	validator = require('validator'),
	ENCRYPTION_ROUNDS = 10;

validator.extend('isPassword', function (str) {
	/**
	* Passwords must:
	* - contain at least 6 characters (but not more than 20)
	* - contain at least one lowercase letter
	* - contain at least one uppercase letter
	* - contain at least one number
	*/
	return str.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}/);
});

var UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		trim: true,
		lowercase: true,
		unique: true,
		index: true,
		validate: [
			{
				validator: validator.isAlphanumeric,
				msg: 'Contains non-alphanumeric characters.'
			},
			{
				validator: function (str) {
					return validator.isLength(str, 3, 15);
				},
				msg: 'Must have a length between [3,15] characters.'
			}
		]
	},
	email: { 
		type: String,
		required: true,
		trim: true,
		lowercase: true,
		unique: true,
		index: true,
		validate: [
			{
				validator: validator.isEmail,
				msg: 'Invalid email.'
			}
		]
	},
	emailHash: {
		type: String
	},
	password: {
		type: String,
		required: true,
		trim: true,
		validate: [
			{
				validator: validator.isPassword,
				msg: 'Does not meet minimum requirements.'
			}
		]
	},
	verified: {
		type: Boolean,
		default: false
	},
	name: {
		type: String,
		trim: true,
		validate: [
			{
				validator: function (str) {
					return validator.isLength(str, 0, 30);
				},
				msg: 'Must have a length between [0,30] characters.'
			}
		]
	},
	website: {
		type: String,
		trim: true,
		validate: [
			{
				validator: function (str) {
					return validator.isLength(str, 0, 200);
				},
				msg: 'Must have a length between [0,200] characters.'
			},
			{
				validator: function (str) {
					return str.length===0 || validator.isURL(str, {
						protocols: ['http', 'https'],
						require_protocol: true,
						allow_underscores: true
					});
				},
				msg: 'Not a valid URL.'
			}
		]
	},
	location: {
		type: String,
		trim: true,
		validate: [
			{
				validator: function (str) {
					return validator.isLength(str, 0, 30);
				},
				msg: 'Must have a length between [0,30] characters.'
			}
		]
	}
});

// Mongoose middleware to hash plain password when user.save is called
UserSchema.pre('save', function (next) {
  var user = this;

  if(!user.isModified('password')) {
  	return next();
  }

  UserSchema.statics.hashPassword(user.password, function (err, hash) {
  	if(err) {
  		debug('unable to hash password %j', err);
  		return next(err);
  	}
		user.password = hash;
		next();
  });
});

// Mongoose middleware to md5 hash email
UserSchema.pre('save', function (next) {
	var user = this;

	if(!user.isModified('email')) {
		return next();
	}

	UserSchema.statics.hashEmail(user.email, function (err, hash) {
		if(err) {
			debug('unable to hash email %j', err);
			return next(err);
		}
		user.emailHash = hash;
		next();
	});
});

UserSchema.statics.hashEmail = function (email, cb) {
	cb(null, crypto.createHash('md5').update(email).digest('hex'));
};

UserSchema.statics.hashPassword = function (password, cb) {
  bcrypt.genSalt(ENCRYPTION_ROUNDS, function (err, salt) {
    if (err) {
    	debug('unable to generate bcrypt salt %j', err);
    	return cb(err);
    }

    // Hash the password with generated salt
    bcrypt.hash(password, salt, cb);
  });
};

UserSchema.methods.comparePassword = function (password, cb) {
	bcrypt.compare(password, this.password, function (err, authenticated) {
		if(err) {
			debug('unable to compare passwords %j', err);
			return cb(err);
		}
		cb(null, authenticated);
	});
};

UserSchema.virtual('displayName').get(function () {
	return this.name || '@' + this.username;
});
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

module.exports = restful.model('User', UserSchema);

// Requiring circular dependencies has to be done after export
var Event = require('./event'),
	Message = require('./message');

// Mongoose middleware to cascade delete to Events owned by this user
UserSchema.pre('remove', function (next) {
	var user = this;

	Event.remove({ owner: user._id }).exec(function (err) {
		if(err) {
			debug('User failed to cascade delete to Events: %j', err);
			next(err);
		} else {
			next();
		}
	});
});

// Mongoose middleware to cascade delete to any Messages authored by this user
UserSchema.pre('remove', function (next) {
	var user = this;

	Message.remove({ author: user._id }).exec(function (err) {
		if(err) {
			debug('User failed to cascade delete to Messages: %j', err);
			next(err);
		} else {
			next();
		}
	});
});
