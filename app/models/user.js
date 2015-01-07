'use strict';

var mongoose = require('mongoose'),
	bcrypt = require('bcrypt'),
	ENCRYPTION_ROUNDS = 10;

var UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		index: {
			unique: true
		}
	},
	email: { 
		type: String,
		required: true,
		index: {
			unique: true
		}
	},
	password: {
		type: String,
		required: true
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