var impl = require('implementjs')
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

var credentialBearerImpl = {
	bearerToken: impl.S
}

var credentialSharedKeyImpl = {
	privateKey: impl.S,
	publicKey: impl.S,
}

function verifyCredentials(credentials) {
	if(!credentials){
		throw impl.NotImplementedError
	}

	if(credentials.bearerToken !== undefined) {
		impl.implements(credentials, credentialBearerImpl)
		return
	}

	impl.implements(credentials, credentialSharedKeyImpl)
}

var trunkScopeImpl = {
	trunk: impl.S
}

var branchScopeImpl = {
	trunk: impl.S,
	branch: impl.S
}

function verifyScope(scope) {
	if(!scope){
		throw new InvalidArgumentError('scope')
	}

	if(scope.branch !== undefined) {
		impl.implements(scope, branchScopeImpl)
		/* istanbul ignore else */
		if(scope.branch === '') {
			throw new InvalidArgumentError('branch')
		}
		/* istanbul ignore next */
		return
	}

	impl.implements(scope, trunkScopeImpl)
}

function verifyOptions(options) {
	if(options === undefined) {
		return
	}

	if(options.url === undefined && options.fingerPrintingEnabled === undefined) {
		throw new impl.NotImplementedError
	}

	if(options.url !== undefined) {
		impl.implements(options, { url: impl.S })
	}

	/* istanbul ignore else */
	if(options.fingerPrintingEnabled !== undefined) {
		impl.implements(options, { fingerPrintingEnabled: impl.B })
	}
}