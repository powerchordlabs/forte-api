import superagent from 'superagent';

const METHODS = ['get', 'post', 'put', 'patch', 'del'];

const API_HOST = 'window.POWERCHORD.APIURL;'

class Client {

  formatUrl(path) {
    const adjustedPath = path[0] !== '/' ? '/' + path : path;
    return API_HOST + adjustedPath;
  }

  constructor(req) {
    METHODS.forEach((method) =>
      this[method] = (path, { params, data, headers } = {}) => new Promise((resolve, reject) => {
        const request = superagent[method](formatUrl(path));

        if (params) {
          request.query(params);
        }

        if (data) {
          request.send(data);
        }

        if (headers) {
          request.set(headers)
        }

        request.end((err, { body } = {}) => err ? reject(body || err) : resolve(body));
      }));
  }
}

const ApiClient = Client;

export default ApiClient;
