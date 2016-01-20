import ApiClient from './client'
import { InvalidArgumentError } from './util'

exports = module.exports = createApi

const DEFAULTS = {
	url: 'https://api.powerchord.io',
	fingerPrintingEnabled: true
}

function createApi(credentials, scope, options) {
	validateArgs('createApi', arguments)
	let opts = {...DEFAULTS, ...options}
	return forteApi(credentials, scope, opts)
}

function forteApi(credentials, scope, options) {
	let authToken;
	let client = new ApiClient(scope.hostname, credentials, options.url, (err, response) => {
		eventRegistry.auth.forEach((cb => cb(err, response)))
	});

	let eventRegistry = {
		auth: []
	}

	return {
		withBranch(id) {
			validateArgs('withBranch', arguments)

			let newScope = {...scope, ...{ branch: id}}
			return createApi(credentials, newScope, options)
		},
		getScope(){
			return scope
		}, 
		on(name, callback) {
			validateArgs('on', arguments)
			eventRegistry[name].push(callback)
		},
		log(level, message, meta) {
			validateArgs('log', arguments) 
			return client.post('/log', { data: { level, message, meta } })
		}

	}
}

/* 
 * method validations
 */
const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

function argumentError(name) {
	throw new InvalidArgumentError(name)
}

function validateArgs(method, args) {
	validators[method].apply(null, args)
}

const validators = {
	createApi: (credentials, scope, options) => {
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
			
			if(typeof scope.hostname !== 'string' || scope.hostname === ''){
				argumentError('scope.hostname')
			}

			if(typeof scope.trunk !== 'string' || scope.trunk === ''){
				argumentError('scope.trunk')
			}

			if(scope.branch !== undefined && typeof scope.branch !== 'string' || scope.branch === ''){
				argumentError('scope.branch')
			}
		}

		function verifyOptions(options) {
			// note: undefined is supported as options are merged with defaults in createApi

			if(options.url !== undefined && typeof options.url !== 'string') {
				argumentError('options.url')
			}

			if(options.fingerPrintingEnabled !== undefined && typeof options.fingerPrintingEnabled !== 'boolean') {
				argumentError('options.fingerPrintingEnabled')
			}
		}

		verifyCredentials(credentials)
		verifyScope(scope)
		verifyOptions(options)
	},
	withBranch: (id) => {
		if(id === undefined){
			throw new InvalidArgumentError('id')
		}
	},
	log: (level, message, meta) => {
		if(LOG_LEVELS.indexOf(level) === -1) {
			argumentError('Log level "' + level + '" is invalid. Use one of: ' + LOG_LEVELS.join(', '))
		}

		if(typeof message !== 'string' || message.trim() === '') {
			argumentError('Message "' + message + '" is invalid.')
		}

		if(meta !== undefined && (meta === null || typeof meta !== 'object')){
			argumentError('Meta "' + meta + '" is invalid.')
		}
	},
	on: (name, callback) => {
		if(name !== 'auth') {
			argumentError('"' + name + '" is not a supported event.')
		}

		if(typeof callback !== 'function') {
			argumentError('callback must be a function.')
		}
	}
}
