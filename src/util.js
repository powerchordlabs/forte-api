'use strict';

require('extend-error')

export const ApiPaths = {
  log: '/developer/log',
  auth: '/authenticate/credentials',
  experience: {
    session: function session() {
      return '/session/check';
    },
    bootstrap: function bootstrap(id) {
      return '/forte/bootstrap/' + id;
    }
  },
  organizations: {
    getMany: function getMany() {
      return '/organizations/';
    },
    getOne: function getOne(id) {
      return '/organizations/' + id;
    },
    getOneByHostname: function getOneByHostname(hostname) {
      return '/organizations?hostname=' + hostname;
    }
  },
  locations: {
    getMany: function getMany(scope) {
      return '/forte/organizations/' + scope.trunk + '/' + scope.branch + '/locations/';
    },
    getOne: function getOne(scope, id) {
      return '/forte/organizations/' + scope.trunk + '/' + scope.branch + '/locations/' + id;
    }
  },
  content: {
    aggregate: function aggregate(scope, type) {
      return '/forte/organizations/' + scope.trunk + '/' + scope.branch + '/content/documents/' + type + '/aggregate/';
    },
    getManyComplex: function getManyComplex(scope, type) {
      return '/forte/organizations/' + scope.trunk + '/' + scope.branch + '/content/documents/' + type + '/';
    },
    getMany: function getMany(scope, type) {
      return '/forte/' + scope.trunk + '/' + scope.branch + '/content/' + type + '/';
    },
    getOne: function getOne(scope, type, id) {
      return '/forte/' + scope.trunk + '/' + scope.branch + '/content/' + type + '/' + id;
    },
    forms: {
      putDocument: function putDocument(scope) {
        return '/forte/organizations/' + scope.trunk + '/content/forms/documents';
      }
    }
  },
  metrics: {
    putMetric: function putMetric(scope) {
      return '/forte/metrics/organizations/record/' + scope.trunk + '/' + scope.branch;
    }
  },
  composite: {
    query: function query(scope) {
      return '/forte/composite/' + scope.trunk + '/' + scope.branch + '/';
    }
  },
  carts: scope => {
    return `/forte/organizations/${scope.trunk}/${scope.branch}/carts`
  },
  search: (scope) => {
    return `/forte/search/${scope.trunk}/${scope.branch}/`
  },
  locator: (scope) => {
    return `/forte/locator/${scope.trunk}`
  }
}
