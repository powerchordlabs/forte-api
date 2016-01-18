exports.InvalidArgumentError = module.exports.InvalidArgumentError = InvalidArgumentError;

/* 
 * Custom Errors
 */
function InvalidArgumentError(message) {
  this.name = 'InvalidArgumentError';
  this.message = message;
}

InvalidArgumentError.prototype = Object.create(Error.prototype);
InvalidArgumentError.prototype.constructor = InvalidArgumentError;