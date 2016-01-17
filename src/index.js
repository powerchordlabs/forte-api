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

function argumentError(name) {
	throw new InvalidArgumentError(name)
}

function verifyCredentials(credentials) {
	if(typeof credentials === 'undefined'){
		argumentError('credentials')
	}

	if(credentials.bearerToken !== undefined) {
		if(typeof credentials.bearerToken !== 'string'){
			argumentError('credentials.bearerToken')
		}
		return
	}

	if(typeof credentials.privateKey !== 'string'){
		argumentError('credentials.privateKey')
	}

	if(typeof credentials.publicKey !== 'string'){
		argumentError('credentials.publicKey')
	}
}

function verifyScope(scope) {
	if(!scope){
		throw new InvalidArgumentError('scope')
	}
	
	if(typeof scope.trunk !== 'string' || scope.trunk === ''){
		argumentError('scope.trunk')
	}

	if(scope.branch !== undefined && typeof scope.branch !== 'string' || scope.branch === ''){
		argumentError('scope.branch')
	}
}

function verifyOptions(options) {
	if(options === undefined) {
		return
	}

	if(options.url === undefined && options.fingerPrintingEnabled === undefined) {
		argumentError('options')
	}

	if(options.url !== undefined && typeof options.url !== 'string') {
		argumentError('options.url')
	}

	if(options.fingerPrintingEnabled !== undefined && typeof options.fingerPrintingEnabled !== 'boolean') {
		argumentError('options.fingerPrintingEnabled')
	}
}