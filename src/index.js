var assign = require('./util').assign

exports = module.exports = createAPI

function createAPI(credentials, scope, options) {
	verifyArgs.apply(null, arguments)
	return forteApi.apply(null, arguments)
}

function forteApi(credentials, scope, options) {
	return {
		withBranch: function(id) {
			if(id === undefined){
				throw new InvalidArgumentError('id')
			}

			var newScope = assign({}, scope, { branch: id})
			return createAPI(credentials, newScope, options)
		},
		getScope: function(){
			return scope
		}
	}
}

/* 
 * Custom Errors
 */
function InvalidArgumentError(field) {
  this.name = 'InvalidArgumentError';
  this.message = 'Invalid Argument: ' + id;
}
InvalidArgumentError.prototype = Object.create(Error.prototype);
InvalidArgumentError.prototype.constructor = InvalidArgumentError;

/* 
 * Verifcations
 */
function verifyArgs(credentials, scope, options) {
	verifyCredentials(credentials)
	verifyScope(scope)
	verifyOptions(options)
}

function verifyCredentials(credentials) {
	if(typeof credentials === 'undefined'){
		throw new InvalidArgumentError('credentials')
	}

	if(credentials.bearerToken !== undefined) {
		if(typeof credentials.bearerToken !== 'string'){
			throw new InvalidArgumentError('credentials.bearerToken')
		}
		return
	}

	if(typeof credentials.privateKey !== 'string'){
		throw new InvalidArgumentError('credentials.privateKey')
	}

	if(typeof credentials.publicKey !== 'string'){
		throw new InvalidArgumentError('credentials.publicKey')
	}
}

function verifyScope(scope) {
	if(!scope){
		throw new InvalidArgumentError('scope')
	}

	if(scope.branch !== undefined) {
		if(typeof scope.branch !== 'string' || scope.branch === ''){
			throw new InvalidArgumentError('scope.branch')
		}
		/* istanbul ignore next */
		return
	}

	if(typeof scope.trunk !== 'string' || scope.trunk === ''){
		throw new InvalidArgumentError('scope.trunk')
	}
}

function verifyOptions(options) {
	if(options === undefined) {
		return
	}

	if(options.url === undefined && options.fingerPrintingEnabled === undefined) {
		throw new InvalidArgumentError('options')
	}

	if(options.url !== undefined && typeof options.url !== 'string') {
		throw new InvalidArgumentError('options.url')
	}

	/* istanbul ignore else */
	if(options.fingerPrintingEnabled !== undefined && typeof options.fingerPrintingEnabled !== 'boolean') {
		throw new InvalidArgumentError('options.fingerPrintingEnabled')
	}
}