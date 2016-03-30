'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports = module.exports = createApi;

var DEFAULTS = {
	url: 'https://api.powerchord.io',
	fingerPrintingEnabled: true
};

function createApi(credentials, scope, options) {
	validateArgs('createApi', arguments);
	var opts = _extends({}, DEFAULTS, options);
	return forteApi(credentials, scope, opts);
}

function forteApi(credentials, scope, options) {
	var authToken = void 0;
	var client = new _client2.default(scope.hostname, credentials, options.url, function (err, token) {
		eventRegistry.auth.forEach(function (cb) {
			return cb(err, token);
		});
	});

	var eventRegistry = {
		auth: []
	};

	return {
		withBranch: function withBranch(id) {
			validateArgs('withBranch', arguments);

			var newScope = _extends({}, scope, { branch: id });
			return createApi(credentials, newScope, options);
		},
		getScope: function getScope() {
			return scope;
		},
		on: function on(name, callback) {
			validateArgs('on', arguments);
			eventRegistry[name].push(callback);
		},
		log: function log(level, message, meta) {
			validateArgs('log', arguments);
			return client.post(_util.ApiPaths.log, { data: { level: level, message: message, meta: meta } });
		},
		experience: {
			session: function session(id) {
				return client.get(_util.ApiPaths.experience.session());
			},
			bootstrap: function bootstrap(id) {
				validateArgs('entity_byID', arguments);
				return client.get(_util.ApiPaths.experience.bootstrap(id));
			}
		},
		organizations: {
			getMany: function getMany(filter) {
				validateArgs('entity_byFilter', arguments);
				return client.get(_util.ApiPaths.organizations.getMany(), { params: filter });
			},
			getOne: function getOne(id) {
				validateArgs('entity_byID', arguments);
				return client.get(_util.ApiPaths.organizations.getOne(id));
			},
			getOneByHostname: function getOneByHostname(hostname) {
				validateArgs('entity_byHostname', arguments);
				return client.get(_util.ApiPaths.organizations.getOneByHostname(hostname));
			}
		},
		locations: {
			getMany: function getMany(filter) {
				validateArgs('entity_byFilter', arguments);
				return client.get(_util.ApiPaths.locations.getMany(scope), { params: filter });
			},
			getOne: function getOne(id) {
				validateArgs('entity_byID', arguments);
				return client.get(_util.ApiPaths.locations.getOne(scope, id));
			}
		},
		content: {
			getMany: function getMany(type, filter) {
				validateArgs('content_getMany', arguments);
				return client.get(_util.ApiPaths.content.getMany(scope, type), { params: filter });
			},
			getOne: function getOne(type, id) {
				validateArgs('content_getOne', arguments);
				return client.get(_util.ApiPaths.content.getOne(scope, type, id));
			}
		},
		composite: {
			query: function query(_query) {
				validateArgs('composite_query', arguments);
				return client.post(_util.ApiPaths.composite.query(scope), { data: _query });
			}
		}
	};
}

/*
 * method validations
 */
var LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

function validateArgs(method, args) {
	if (process.env.NODE_ENV !== 'production') {
		validators[method].apply(null, args);
	}
}

function isEmptyObject(obj) {
	return !obj || (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object' || Object.keys(obj).length === 0;
}

function isInvalidString(obj) {
	return typeof obj !== 'string' || obj.trim() === '';
}

var validators = {
	createApi: function createApi(credentials, scope, options) {
		function verifyCredentials(credentials) {
			if (!credentials) {
				throw new _util.InvalidArgumentError('credentials');
			}

			if (credentials.bearerToken !== undefined) {
				if (typeof credentials.bearerToken !== 'string') {
					throw new _util.InvalidArgumentError('credentials.bearerToken');
				}
				return;
			}

			if (typeof credentials.privateKey !== 'string') {
				throw new _util.InvalidArgumentError('credentials.privateKey');
			}

			if (typeof credentials.publicKey !== 'string') {
				throw new _util.InvalidArgumentError('credentials.publicKey');
			}
		}

		function verifyScope(scope) {
			if (!scope) {
				throw new _util.InvalidArgumentError('scope');
			}

			if (typeof scope.hostname !== 'string' || scope.hostname === '') {
				throw new _util.InvalidArgumentError('scope.hostname');
			}

			if (typeof scope.trunk !== 'string' || scope.trunk === '') {
				throw new _util.InvalidArgumentError('scope.trunk');
			}

			if (scope.branch !== undefined && typeof scope.branch !== 'string' || scope.branch === '') {
				throw new _util.InvalidArgumentError('scope.branch');
			}
		}

		function verifyOptions(options) {
			// note: undefined is supported as options are merged with defaults in createApi
			if (options === undefined) return;

			if (options.url !== undefined && typeof options.url !== 'string') {
				throw new _util.InvalidArgumentError('options.url');
			}

			if (options.fingerPrintingEnabled !== undefined && typeof options.fingerPrintingEnabled !== 'boolean') {
				throw new _util.InvalidArgumentError('options.fingerPrintingEnabled');
			}
		}

		verifyCredentials(credentials);
		verifyScope(scope);
		verifyOptions(options);
	},
	withBranch: function withBranch(id) {
		if (id === undefined) {
			throw new _util.InvalidArgumentError('id');
		}
	},
	log: function log(level, message, meta) {
		if (LOG_LEVELS.indexOf(level) === -1) {
			throw new _util.InvalidArgumentError('Log level "' + level + '" is invalid. Use one of: ' + LOG_LEVELS.join(', '));
		}

		if (typeof message !== 'string' || message.trim() === '') {
			throw new _util.InvalidArgumentError('Message "' + message + '" is invalid.');
		}

		if (meta !== undefined && (meta === null || (typeof meta === 'undefined' ? 'undefined' : _typeof(meta)) !== 'object')) {
			throw new _util.InvalidArgumentError('Meta "' + meta + '" is invalid.');
		}
	},
	on: function on(name, callback) {
		if (name !== 'auth') {
			throw new _util.InvalidArgumentError('"' + name + '" is not a supported event.');
		}

		if (typeof callback !== 'function') {
			throw new _util.InvalidArgumentError('callback must be a function.');
		}
	},
	entity_byFilter: function entity_byFilter(filter) {
		if (isEmptyObject(filter)) {
			throw new _util.InvalidArgumentError('filter');
		}
	},
	entity_byID: function entity_byID(id) {
		if (isInvalidString(id)) {
			throw new _util.InvalidArgumentError('id');
		}
	},
	entity_byHostname: function entity_byHostname(hostname) {
		if (isInvalidString(hostname)) {
			throw new _util.InvalidArgumentError('hostname');
		}
	},
	content_getMany: function content_getMany(type, filter) {
		if (isInvalidString(type)) {
			throw new _util.InvalidArgumentError('type');
		}
		if (isEmptyObject(filter)) {
			throw new _util.InvalidArgumentError('filter');
		}
	},
	content_getOne: function content_getOne(type, id) {
		if (isInvalidString(type)) {
			throw new _util.InvalidArgumentError('type');
		}
		if (isInvalidString(id)) {
			throw new _util.InvalidArgumentError('id');
		}
	},
	composite_query: function composite_query(query) {
		if (isEmptyObject(query)) {
			throw new _util.InvalidArgumentError('query');
		}
	}
}
