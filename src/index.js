import client from './client'
import { InvalidArgumentError } from './util'

exports = module.exports = createApi

function createApi(credentials, scope, options) {
	validateArgs('createApi', arguments)
	return forteApi.apply(null, arguments)
}

function forteApi(credentials, scope, options) {
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
			client.get('http://www.google.com').then(response => {
				callback(null, response)
			})
		},
		log(level, message, meta) {
			validateArgs('log', arguments)
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
