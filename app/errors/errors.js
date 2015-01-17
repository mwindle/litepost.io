'use strict';


function UnauthorizedError () {
  Error.call(this, arguments);
  this.name = 'UnauthorizedError';
  this.status = 401;
}

UnauthorizedError.prototype = Object.create(Error.prototype);

function ForbiddenError () {
  Error.call(this, arguments);
  this.name = 'ForbiddenError';
  this.status = 403;
}

ForbiddenError.prototype = Object.create(Error.prototype);


function NotFoundError () {
  Error.call(this, arguments);
  this.name = 'NotFoundError';
  this.status = 404;
}

NotFoundError.prototype = Object.create(Error.prototype);


function ServerError () {
  Error.call(this, arguments);
  this.name = 'ServerError';
  this.status = 500;
}

ServerError.prototype = Object.create(Error.prototype);

function SchemaValidationError () {
  Error.call(this, arguments);
  this.name = 'SchemaValidationError';
  this.status = 400;
}

SchemaValidationError.prototype = Object.create(Error.prototype);

module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
module.exports.NotFoundError = NotFoundError;
module.exports.ServerError = ServerError;
module.exports.SchemaValidationError = SchemaValidationError;
