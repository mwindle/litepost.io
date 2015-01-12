'use strict';

var mongoose = require('mongoose'),
	restful = require('node-restful'),
	bcrypt = require('bcrypt'),
	crypto = require('crypto'),
	validator = require('validator'),
	ENCRYPTION_ROUNDS = 10;

validator.extend('isPassword', function (str) {
	/**
	* Passwords must:
	* - contain at least 6 characters (but not more than 30)
	* - contain at least one lowercase letter
	* - contain at least one uppercase letter
	* - contain at least one number
	*/
	return str.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,30}/);
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
				msg: '{VALUE} is invalid because it contains non-alphanumeric characters'
			},
			{
				validator: function (str) {
					return validator.isLength(str, 3, 30);
				},
				msg: '{VALUE} length is not in [3,30]'
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
				msg: '{VALUE} is not a valid email.'
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
				msg: '{VALUE] does not meet minimum password requirements.'
			}
		]
	},
	name: {
		type: String,
		trim: true,
		validate: [
			{
				validator: validator.isAscii,
				msg: '{VALUE} is invalid because it contains non-ASCII characters'
			},
			{
				validator: function (str) {
					return validator.isLength(str, 0, 50);
				},
				msg: '{VALUE} length is not in [0,30]'
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
    	return cb(err);
    }

    // Hash the password with generated salt
    bcrypt.hash(password, salt, cb);
  });
};

UserSchema.methods.comparePassword = function (password, cb) {
	bcrypt.compare(password, this.password, function (err, authenticated) {
		if(err) {
			return cb(err);
		}
		cb(null, authenticated);
	});
};

module.exports = restful.model('User', UserSchema);
