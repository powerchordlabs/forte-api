var util = require('./util')
var assign = util.assign
var InvalidArgumentError = util.InvalidArgumentError

exports = module.exports = createApi

function createApi(credentials, scope, options) {
	verifyCreateApiArgs.apply(null, arguments)
	return forteApi.apply(null, arguments)
}

function forteApi(credentials, scope, options) {
	return {
		withBranch: function(id) {
			verifyWithBranchArgs.apply(null, arguments)

			var newScope = assign({}, scope, { branch: id})
			return createApi(credentials, newScope, options)
		},
		getScope: function(){
			return scope
		},
		on: function(name, callback) {
			verifyOnArgs.apply(null, arguments)
		},
		log: function(level, message, meta) {
			verifyLogArgs.apply(null, arguments)
		}

	}
}

var LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

/* 
 * Verifcations
 */
function argumentError(name) {
	throw new InvalidArgumentError(name)
}

function verifyCreateApiArgs(credentials, scope, options) {
	verifyCredentials(credentials)
	verifyScope(scope)
	verifyOptions(options)
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

function verifyWithBranchArgs(id) {
	if(id === undefined){
		throw new InvalidArgumentError('id')
	}
}

function verifyLogArgs(level, message, meta) {
	if(LOG_LEVELS.indexOf(level) === -1) {
		argumentError('Log level "' + level + '" is invalid. Use one of: ' + LOG_LEVELS.join(', '))
	}

	if(typeof message !== 'string' || message.trim() === '') {
		argumentError('Message "' + message + '" is invalid.')
	}

	if(meta !== undefined && (meta === null || typeof meta !== 'object')){
		argumentError('Meta "' + meta + '" is invalid.')
	}
}

function verifyOnArgs(name, callback) {
	if(name !== 'auth') {
		argumentError('"' + name + '" is not a supported event.')
	}

	if(typeof callback !== 'function') {
		argumentError('callback must be a function.')
	}
}