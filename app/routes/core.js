'use strict';


module.exports = function(app) {

	// Static home page
	app.route('/').get(function (req, res) {
		res.render('index');
	});

	// Routes /app/* to the AngularJS app, the regex lets Angular do its client-side magic
	app.route(/^\/app(\/.*)?$/).get(function (req, res) {
		res.render('app');
	});

};