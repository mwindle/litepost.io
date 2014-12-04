'use strict';

module.exports = Auth();

function Auth() {
	if(!(this instanceof Auth)) { return new Auth(); }
}

Auth.prototype.ensureAuthenticated = function(req, res, next) {
	if(req.user) { return next(); }
	return res.status(401).send({
		message: "Authorization required",
		loginUrl: "/login"
	});
};
