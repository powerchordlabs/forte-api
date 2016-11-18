import ApiClient from './client'
import { InvalidArgumentError, ApiPaths } from './util'

exports = module.exports = createApi

const DEFAULTS = {
  url: 'https://api.powerchord.io',
  fingerPrintingEnabled: true
}

function createApi(credentials, scope, options) {
  validateArgs('createApi', arguments)
  const opts = {...DEFAULTS, ...options}
  return forteApi(credentials, scope, opts)
}

function forteApi(credentials, scope, options) {
  const client = new ApiClient(scope.hostname, credentials, options.url, (err, token) => {
    eventRegistry.auth.forEach((cb => cb(err, token)))
  })

  const eventRegistry = {
    auth: []
  }

  return {
    withBranch(id) {
      validateArgs('withBranch', arguments)

      const newScope = {...scope, ...{ branch: id}}
      return createApi(credentials, newScope, options)
    },
    getScope() {
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
    auth() {
      return client.post(ApiPaths.auth, { data: { email: credentials.email, password: credentials.password }})
    },
    experience: {
      session() {
        return client.get(ApiPaths.experience.session())
      },
      bootstrap(id) {
        validateArgs('entity_byID', arguments)
        return client.get(ApiPaths.experience.bootstrap(id))
      }
    },
    organizations: {
      getMany(filter) {
        validateArgs('entity_byFilter', arguments)
        return client.get(ApiPaths.organizations.getMany(), { params: filter })
      },
      getOne(id) {
        validateArgs('entity_byID', arguments)
        return client.get(ApiPaths.organizations.getOne(id))
      },
      getOneByHostname(hostname) {
        validateArgs('entity_byHostname', arguments);
        return client.get(ApiPaths.organizations.getOneByHostname(hostname));
      }
    },
    locations: {
      getMany(filter) {
        validateArgs('entity_byFilter', arguments)
        return client.get(ApiPaths.locations.getMany(scope), { params: filter })
      },
      getOne(id) {
        validateArgs('entity_byID', arguments)
        return client.get(ApiPaths.locations.getOne(scope, id))
      }
    },
    content: {
      getMany(type, filter) {
        validateArgs('content_getMany', arguments)
        return client.get(ApiPaths.content.getMany(scope, type), { params: filter })
      },
      getOne(type, id) {
        validateArgs('content_getOne', arguments)
        return client.get(ApiPaths.content.getOne(scope, type, id))
      },
      forms: {
        putDocument(collection, data) {
          return client.put(ApiPaths.content.forms.putDocument(scope), { data: { collection, data } });
        }
      }
    },
    metrics: {
      putPageview(data) {
        validateArgs('metrics_pageview', arguments);
        return client.put(ApiPaths.metrics.putMetric(scope), { data: { type: 'pageview', data } });
      }
    },
    composite: {
      query(query) {
        validateArgs('composite_query', arguments)
        return client.post(ApiPaths.composite.query(scope), { data: query })
      }
    },
    carts: {
      get: () => {
        return client.get(ApiPaths.carts(scope))
      },
      post: data => {
        return client.post(ApiPaths.carts(scope) + '/', { data })
      },
      id: cartId => {
        return {
          get: () => {
            return client.get(ApiPaths.carts(scope) + `/${cartId}`)
          },
          items: {
            post: data => {
              return client.post(ApiPaths.carts(scope) + `/${cartId}/items/`, { data })
            },
            id: itemId => {
              return {
                patch: data => {
                  return client.patch(ApiPaths.carts(scope) + `/${cartId}/items/${itemId}`, { data })
                }
              }
            }
          },
          contacts: {
            post: data => {
              return client.post(ApiPaths.carts(scope) + `/${cartId}/contacts/`, { data })
            },
            id: contactId => {
              return {
                delete: () => {
                  return client.delete(ApiPaths.carts(scope) + `/${cartId}/contacts/${contactId}`)
                },
                patch: data => {
                  return client.patch(ApiPaths.carts(scope) + `/${cartId}/contacts/${contactId}`, { data })
                }
              }
            }
          },
          billTo: {
            patch: data => {
              return client.patch(ApiPaths.carts(scope) + `/${cartId}/billTo`, { data })
            }
          },
          shipTo: {
            patch: data => {
              return client.patch(ApiPaths.carts(scope) + `/${cartId}/shipTo`, { data })
            }
          },
          confirmation: {
            get: () => {
              return client.get(ApiPaths.carts(scope) + `/${cartId}/confirmation`)
            }
          },
          checkout: {
            post: data => {
              return client.post(ApiPaths.carts(scope) + `/${cartId}/checkout`, { data })
            }
          }
        }
      }
    },
    search(query, params) {
      validateArgs('search_query', arguments)
      return client.post(ApiPaths.search(scope), { params, data: query })
    },
    locator(query) {
      validateArgs('locator_query', arguments)
      return client.post(ApiPaths.locator(scope), { data: query })
    }
  }
}

/*
* method validations
*/
const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']

function validateArgs(method, args) {
  if(process.env.NODE_ENV !== 'production') {
    validators[method].apply(null, args)
  }
}

function isEmptyObject(obj) {
  return !obj || typeof obj !== 'object' || Object.keys(obj).length === 0
}

function isInvalidString(obj) {
  return typeof obj !== 'string' || obj.trim() === ''
}

const validators = {
  createApi(credentials, scope, options) {
    function verifyCredentials(credentials) {
      if(!credentials) {
        throw new InvalidArgumentError('credentials')
      }

      if(credentials.bearerToken !== undefined) {
        if(typeof credentials.bearerToken !== 'string') {
          throw new InvalidArgumentError('credentials.bearerToken')
        }
        return
      }

      if(typeof credentials.email === 'string' && typeof credentials.privateKey === 'string') {
        throw new InvalidArgumentError('only one of publicKey/privateKey or email/password combinations may be provided.')
      }

      if(typeof credentials.privateKey === 'string') {
        if(typeof credentials.publicKey !== 'string') {
          throw new InvalidArgumentError('credentials.publicKey')
        }
        return
      } else if(typeof credentials.email === 'string'){
        if(typeof credentials.password !== 'string') {
          throw new InvalidArgumentError('credentials.password')
        }
        return
      }

      throw new InvalidArgumentError('credentials in the form of a publicKey/privateKey or email/password combination must be provided.')
    }

    function verifyScope(scope) {
      if(!scope) {
        throw new InvalidArgumentError('scope')
      }

      if(typeof scope.hostname !== 'string' || scope.hostname === '') {
        throw new InvalidArgumentError('scope.hostname')
      }

      if(typeof scope.trunk !== 'string' || scope.trunk === '') {
        throw new InvalidArgumentError('scope.trunk')
      }

      if(scope.branch !== undefined && typeof scope.branch !== 'string' || scope.branch === '') {
        throw new InvalidArgumentError('scope.branch')
      }
    }

    function verifyOptions(options) {
      // note: undefined is supported as options are merged with defaults in createApi
      if (options === undefined) { return }

      if(options.url !== undefined && typeof options.url !== 'string') {
        throw new InvalidArgumentError('options.url')
      }

      if(options.fingerPrintingEnabled !== undefined && typeof options.fingerPrintingEnabled !== 'boolean') {
        throw new InvalidArgumentError('options.fingerPrintingEnabled')
      }
    }

    verifyCredentials(credentials)
    verifyScope(scope)
    verifyOptions(options)
  },
  withBranch(id) {
    if(id === undefined) {
      throw new InvalidArgumentError('id')
    }
  },
  log(level, message, meta) {
    if(LOG_LEVELS.indexOf(level) === -1) {
      throw new InvalidArgumentError('Log level "' + level + '" is invalid. Use one of: ' + LOG_LEVELS.join(', '))
    }

    if(typeof message !== 'string' || message.trim() === '') {
      throw new InvalidArgumentError('Message "' + message + '" is invalid.')
    }

    if(meta !== undefined && (meta === null || typeof meta !== 'object')) {
      throw new InvalidArgumentError('Meta "' + meta + '" is invalid.')
    }
  },
  on(name, callback) {
    if(name !== 'auth') {
      throw new InvalidArgumentError('"' + name + '" is not a supported event.')
    }

    if(typeof callback !== 'function') {
      throw new InvalidArgumentError('callback must be a function.')
    }
  },
  entity_byFilter(filter) {
    if(isEmptyObject(filter)) {
      throw new InvalidArgumentError('filter')
    }
  },
  entity_byID(id) {
    if(isInvalidString(id)) {
      throw new InvalidArgumentError('id')
    }
  },
  entity_byHostname(hostname) {
    if(isInvalidString(hostname)) {
      throw new InvalidArgumentError('hostname');
    }
  },
  content_getMany(type, filter) {
    if(isInvalidString(type)) {
      throw new InvalidArgumentError('type')
    }
    if(isEmptyObject(filter)) {
      throw new InvalidArgumentError('filter')
    }
  },
  content_getOne(type, id) {
    if(isInvalidString(type)) {
      throw new InvalidArgumentError('type')
    }
    if(isInvalidString(id)) {
      throw new InvalidArgumentError('id')
    }
  },
  composite_query(query) {
    if(isEmptyObject(query)) {
      throw new InvalidArgumentError('query')
    }
  },
  metrics_pageview: function metrics_pageview(data) {
    if (isEmptyObject(data)) {
      throw new InvalidArgumentError('data');
    }
  },
  search_query(query) {
    if(isEmptyObject(query)) {
      throw new InvalidArgumentError('query')
    }
  },
  locator_query(query) {
    if(isEmptyObject(query)) {
      throw new InvalidArgumentError('query')
    }
  }
}
