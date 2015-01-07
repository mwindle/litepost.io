'use strict';

var mongoose = require('mongoose'),
	bcrypt = require('bcrypt'),
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
		index: {
			unique: true
		},
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
		index: {
			unique: true
		},
		validate: [
			{
				validator: validator.isEmail,
				msg: '{VALUE} is not a valid email.'
			}
		]
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
	fullName: {
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

  if (!user.isModified('password')) {
  	return next();
  }

  bcrypt.genSalt(ENCRYPTION_ROUNDS, function (err, salt) {
    if (err) {
    	return next(err);
    }

    // Hash the password with generated salt
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) {
      	return next(err);
      }

      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.authenticate = function (password, cb) {
	bcrypt.compare(password, this.password, function (err, authenticated) {
		if(err) {
			return cb(err);
		}
		cb(null, authenticated);
	});
};

module.exports = mongoose.model('User', UserSchema);