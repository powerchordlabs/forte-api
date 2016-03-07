import crypto from 'crypto'
import superagent from 'superagent';
const debug = require('debug')('forte-api:client')

const METHODS = ['get', 'post', 'put', 'patch', 'del'];

function authMiddleware(superagent, hostname, credentials){
  superagent.Request.prototype.sign = function(){
    var authHeader = ''

    if (credentials.bearerToken) {
      authHeader = `${credentials.bearerToken}`
    } else {
      let UTCTimestamp = Math.floor((new Date()).getTime() / 1000)//new Date().getTime()
      let FQDN = hostname
      let checkSumData = [credentials.privateKey, credentials.publicKey, UTCTimestamp, FQDN].join(':')
      debug('checkSumData %s', checkSumData)
      
      let hash = crypto.createHash('sha256').update(checkSumData).digest('hex')
      debug('hash %s', hash)
      
      authHeader = `Checksum ${[credentials.publicKey, UTCTimestamp, hash, FQDN].join(':')}`
    }

    this.set('Authorization', authHeader);

    return this
  }

  return superagent
}

class Client {

  formatUrl(baseUrl, path) {
    const adjustedPath = path[0] !== '/' ? '/' + path : path;
    return baseUrl + adjustedPath;
  }

  constructor(hostname, credentials, baseUrl, onAuth) {
    var agent = authMiddleware(superagent, hostname, credentials)

    METHODS.forEach((method) =>
      this[method] = (path, { params, data, headers } = {}) => new Promise((resolve, reject) => {
        const request = agent[method](this.formatUrl(baseUrl, path)).sign();

        if (params) {
          request.query(params);
        }

        if (data) {
          request.send(data);
        }

        if (headers) {
          request.set(headers)
        }

        request.end((err, res) => {
          if(err){ debug(`client.${method} error: %o`, err) }

          // all succesful api responses have auth header
          onAuth && onAuth(err, err ? null : res.headers.authorization)

          err ? reject(parsed) : resolve(res)
        });
      }));
  }
}

const ApiClient = Client;

export default ApiClient;
