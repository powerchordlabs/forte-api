import crypto from 'crypto'
import superagent from 'superagent'
import InvalidArgumentError from './util'
const debug = require('debug')('forte-api:client')

const METHODS = ['get', 'post', 'put', 'patch', 'delete']

function authMiddleware(superagent, hostname, credentials) {
  superagent.Request.prototype.sign = function() {
    let authHeader = ''

    if (credentials.bearerToken) {
      authHeader = `${credentials.bearerToken}`
    } else if (credentials.privateKey) {
      const UTCTimestamp = Math.floor((new Date()).getTime() / 1000)
      const FQDN = hostname
      const checkSumData = [credentials.privateKey, credentials.publicKey, UTCTimestamp, FQDN].join(':')
      debug('checkSumData %s', checkSumData)

      const hash = crypto.createHash('sha256').update(checkSumData).digest('hex')
      debug('hash %s', hash)

      authHeader = `Checksum ${[credentials.publicKey, UTCTimestamp, hash, FQDN].join(':')}`
    } else if (credentials.email) {
      return this
    } else {
      throw new InvalidArgumentError('No publicKey/privateKey or email/password credentials were provided.')
    }

    this.set('Authorization', authHeader)

    return this
  }

  return superagent
}

class Client {

  formatUrl(baseUrl, path) {
    const adjustedPath = path[0] !== '/' ? '/' + path : path
    return baseUrl + adjustedPath
  }

  constructor(hostname, credentials, baseUrl, onAuth) {
    const agent = authMiddleware(superagent, hostname, credentials)

    METHODS.forEach((method) =>
      this[method] = (path, { params, data, headers } = {}) => new Promise((resolve, reject) => {
        const request = agent[method](this.formatUrl(baseUrl, path)).sign()

        if (params) {
          request.query(params)
        }

        if (data) {
          request.send(data)
        }

        if (headers) {
          request.set(headers)
        }

        request.end((err, res) => {
          if(err) { debug(`client.${method} error: %o`, err) }

          // all successful api responses have auth header <- NOT TRUE on token auth
          // all successful CHECKSUM api responses have auth header, keep the bearerToken if not passed
          onAuth && onAuth(err, err ? null : (res.headers.authorization ? res.headers.authorization : credentials.bearerToken))

          err ? reject(err) : resolve(res)
        })
      }))
  }
}

const ApiClient = Client

export default ApiClient
