/* istanbul ignore next */
var assign = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.assign = module.exports.assign = assign;
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