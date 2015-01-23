'use strict';


/**
 * Module dependencies.
 */
var debug = require('debug')('emails'), 
	config = require('./config'),
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
				return debug('Unable to generate welcome email from template: %j', err);
			}
			if(config.POSTMARK_API_TOKEN) {
				postmark.send({
			    'From': config.fromEmail, 
			    'To': data.user.email, 
			    'Subject': 'Welcome to LitePost.io - Verify your email address', 
			    'HtmlBody': html
				}, function (err, success) {
			    if(err) {
			      return debug('Unable to send email via postmark: %j', err);
			    }
				});
			} else {
				debug('skipping welcome email since no api token configured');
			}
		});
	});
};
