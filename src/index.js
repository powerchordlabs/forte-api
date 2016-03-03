import ApiClient from './client'
import { InvalidArgumentError, ApiPaths } from './util'

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
	let client = new ApiClient(scope.hostname, credentials, options.url, (err, token) => {
		eventRegistry.auth.forEach((cb => cb(err, token)))
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
			return client.post(ApiPaths.log, { data: { level, message, meta } })
		},
		experience: {
			bootstrap(id){
				validateArgs('entity_byID', arguments)
				return client.get(ApiPaths.experience.bootstrap(id))
			}
		},
		organizations: {
			getMany(filter){
				validateArgs('entity_byFilter', arguments)
				return client.get(ApiPaths.organizations.getMany(), { params: filter })
			},
			getOne(id){
				validateArgs('entity_byID', arguments)
				return client.get(ApiPaths.organizations.getOne(id))
			}
		},
		locations: {
			getMany(filter){
				validateArgs('entity_byFilter', arguments)
				return client.get(ApiPaths.locations.getMany(scope), { params: filter })
			},
			getOne(id){
				validateArgs('entity_byID', arguments)
				return client.get(ApiPaths.locations.getOne(scope, id))
			}
		},
		content: {
			getMany(type, filter){
				validateArgs('content_getMany', arguments)
				return client.get(ApiPaths.content.getMany(scope, type), { params: filter })
			},
			getOne(type, id){
				validateArgs('content_getOne', arguments)
				return client.get(ApiPaths.content.getOne(scope, type, id))
			}
		},
		composite: {
			query(query) {
				validateArgs('composite_query', arguments) 
				return client.post(ApiPaths.composite.query, { data: query })
			}
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
	// TODO, add NODE_ENV='production' check here so we can skip validation in production mode
	validators[method].apply(null, args)
}

function isEmptyObject(obj){
	return !obj || typeof obj !== 'object' || Object.keys(obj).length === 0
}

function isInvalidString(obj) {
	return typeof obj !== 'string' || obj.trim() === ''
}

const validators = {
	createApi(credentials, scope, options) {
		function verifyCredentials(credentials) {
			if(!credentials){
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
			if(options === undefined) return

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
	withBranch(id) {
		if(id === undefined){
			throw new InvalidArgumentError('id')
		}
	},
	log(level, message, meta) {
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
	on(name, callback) {
		if(name !== 'auth') {
			argumentError('"' + name + '" is not a supported event.')
		}

		if(typeof callback !== 'function') {
			argumentError('callback must be a function.')
		}
	},
	entity_byFilter(filter) {
		if(isEmptyObject(filter)) {
			argumentError('filter')
		}
	},
	entity_byID(id) {
		if(isInvalidString(id)) {
			argumentError('id')
		}
	},
	content_getMany(type, filter) {
		if(isInvalidString(type)) {
			argumentError('type')
		}
		if(isEmptyObject(filter)) {
			argumentError('filter')
		}
	},
	content_getOne(type, id) {
		if(isInvalidString(type)) {
			argumentError('type')
		}
		if(isInvalidString(id)) {
			argumentError('id')
		}
	},
	composite_query(query) {
		if(isEmptyObject(query)) {
			argumentError('query')
		}
	}
}
