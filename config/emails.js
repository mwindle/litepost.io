'use strict';

/**
 * Module dependencies.
 */
var config = require('./config'),
	postmark = require('postmark')(config.POSTMARK_API_TOKEN),
	emitter = require('./emitter');

module.exports = function (app) {

	emitter.onNewUser(function (data) {
		var verificationLinkBase = 'https://litepost.io/app/settings/verify';
		var locals = {
			verificationToken: data.verificationToken,
			verificationLinkBase: verificationLinkBase,
			verificationLink: verificationLinkBase + '?t=' + data.verificationToken, 
			signInLink: 'https://litepost.io/app/login'
		};
		app.render('emails/welcome', locals, function (err, html) {
			if(err) {
				return console.error('Unable to generate welcome email from template: ' + err.message);
			}

			postmark.send({
		    'From': 'marc@mwindle.com', 
		    'To': data.user.email, 
		    'Subject': 'Welcome to LitePost.io - Verify your email address', 
		    'HtmlBody': html
			}, function (err, success) {
		    if(err) {
		      return console.error("Unable to send via postmark: " + err.message);
		    }
			});
		});
	});
};
