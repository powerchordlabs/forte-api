var impl = require('implementjs')

exports = module.exports = createAPI

/* istanbul ignore next */
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function createAPI(credentials, scope, options) {
	verfifyCredentials(credentials)
	verfifyScope(scope)

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

var credentialBearerImpl = {
	bearerToken: impl.S
}
var credentialSharedKeyImpl = {
	privateKey: impl.S,
	publicKey: impl.S,
}

function verfifyCredentials(credentials) {
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

function verfifyScope(scope) {
	if(!scope){
		throw new impl.NotImplementedError
	}
	if(scope.branch !== undefined) {
		impl.implements(scope, branchScopeImpl)
		return
	}
	impl.implements(scope, trunkScopeImpl)
}