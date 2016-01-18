import superagent from 'superagent';

const METHODS = ['get', 'post', 'put', 'patch', 'del'];

const API_HOST = 'https://api.pclocal.us' //window.POWERCHORD.APIURL;'

class Client {

  formatResponse(response) {
    let { statusCode, res: { body, text, statusMessage }, xhr, headers } = response
    return {
      status: statusCode,
      statusText: statusMessage || xhr && xhr.statusText,
      headers: headers,
      data: body || text,
    }
  }

  formatUrl(path) {
    const adjustedPath = path[0] !== '/' ? '/' + path : path;
    return API_HOST + adjustedPath;
  }

  constructor(req) {
    METHODS.forEach((method) =>
      this[method] = (path, { params, data, headers } = {}) => new Promise((resolve, reject) => {
        const request = superagent[method](this.formatUrl(path));

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
          let parsed = this.formatResponse(res)
          err ? reject(parsed) : resolve(parsed)
        });
      }));
  }
}

const ApiClient = Client;

export default ApiClient;
