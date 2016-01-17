var impl = require('implementjs')

exports = module.exports = createAPI

/* istanbul ignore next */
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function createAPI(credentials, scope, options) {
	verifyCredentials(credentials)
	verifyScope(scope)
	verifyOptions(options)

	return forteApi(credentials, scope, options)
}

function forteApi(credentials, scope, options) {
	return {
		withBranch: function(id) {
			if(id === undefined){
				throw impl.NotImplementedError
			}

			var newScope = _extends({}, scope)
			newScope.branch = id
			return createAPI(credentials, newScope, options)
		}
	}
}

/* 
 * Verifcations
 */
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
		throw new impl.NotImplementedError
	}

	if(scope.branch !== undefined) {
		impl.implements(scope, branchScopeImpl)
		if(scope.branch === '') {
			throw new Error('Invalid argument.')
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