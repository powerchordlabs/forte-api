import { assert } from 'chai'
import { stringify } from 'querystring'
import forteApi from '../src'
import { InvalidArgumentError, ApiPaths } from '../src/util'

import nock from 'nock'
import mockapi, { MOCK_AUTH_TOKEN } from './mocks/pc6api'

const DEFAULT_OPTIONS = {
  url: 'http://api.pclocal.us',
  fingerPrintingEnabled: true
}

describe('forteApi', () => {
  function apiFactory(credentials, scope, options) {
    const opts = {...DEFAULT_OPTIONS, ...options}
    return () => {
      return forteApi(credentials, scope, opts)
    }
  }

  const validTokenCreds = {bearerToken: 'Bearer VALID_TOKEN'}
  const validKeyCreds = {privateKey: 'VALID_PRIVATEKEY', publicKey: 'VALID_PUBLICKEY'}
  const validTrunkScope = { hostname: 'dealer.client.us', trunk: 'VALID_TRUNK' }
  const validTrunkAndBranchScope = { hostname: 'dealer.client.us', trunk: 'VALID_TRUNK', branch: 'VALID_BRANCH' }

  const invalidBranchScopes = [null, '', 1, {}, () => {}]

  let api

  beforeEach(() => {
    api = apiFactory(validTokenCreds, validTrunkAndBranchScope)()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('ctor(credentials, scope, options)', () => {
    const invalidCredentials = [
      undefined,
      null,
      {},
      {bearerToken: null},
      {bearerToken: 0},
      {privateKey: null, publicKey: null},
      {privateKey: 0, publicKey: 0},
      {privateKey: 'valid', publicKey: 0},
      {privateKey: 0, publicKey: 'valid'}
    ]

    invalidCredentials.forEach(invalidCreds => {
      it(`should throw for credentials ${JSON.stringify(invalidCreds)}`, () => {
        assert.throws(apiFactory(invalidCreds, validTrunkScope), InvalidArgumentError)
      })
    })

    it('should NOT throw if valid credentials have been provided', () => {
      assert.doesNotThrow(apiFactory(validTokenCreds, validTrunkScope))
      assert.doesNotThrow(apiFactory(validKeyCreds, validTrunkScope))
    })

    const invalidTrunkScopes = [
      undefined,
      null,
      {},
      { hostname: 'dealer.client.us', trunk: null },
      { hostname: 'dealer.client.us', trunk: '' }
    ]
    invalidTrunkScopes.forEach(invalid => {
      it(`should throw for trunk scope ${JSON.stringify(invalid)}`, () => {
        assert.throws(apiFactory(validTokenCreds, invalid), InvalidArgumentError)
      })
    })

    it('should throw if an invalid a branch scope has been provided', () => {
      invalidBranchScopes.forEach(scope => {
        assert.throws(apiFactory(validTokenCreds, {trunk:'valid', branch: scope}), InvalidArgumentError)
      })
    })

    const invalidOptions = [
      { url: 0 },
      { fingerPrintingEnabled: 'invalid' },
      { url: 'valid', fingerPrintingEnabled: 'invalid' },
      { url: 0, fingerPrintingEnabled: true }
    ]
    invalidOptions.forEach(options => {
      it(`should throw for options ${JSON.stringify(options)}`, () => {
        assert.throws(apiFactory(validTokenCreds, validTrunkScope, options), InvalidArgumentError)
      })
    })

    const validOptions = [
      undefined,
      { url: 'valid' },
      { fingerPrintingEnabled: true },
      { url: 'valid', fingerPrintingEnabled: true }
    ]
    validOptions.forEach(options => {
      it(`should NOT throw for options ${JSON.stringify(options)}`, () => {
        assert.doesNotThrow(apiFactory(validTokenCreds, validTrunkScope, options))
      })
    })
  })

  describe('.withBranch(id)', () => {
    let branchApi

    beforeEach(() => {
      branchApi = api.withBranch('branchid')
    })

    it('should throw when id is invalid', () => {
      invalidBranchScopes
      .concat(undefined)
      .forEach(scope => {
        assert.throws(() => { api.withBranch(scope) }, InvalidArgumentError)
      })
    })

    it('should return a new instance with the correct scope', () => {
      assert.notStrictEqual(api, branchApi)
      assert.deepEqual(branchApi.getScope(), {...validTrunkAndBranchScope, ...{ branch: 'branchid'}})
    })

    it('should NOT alter the original api scope', () => {
      assert.deepEqual(api.getScope(), validTrunkAndBranchScope)
    })
  })

  describe('.getScope()', () => {

    it('should return the api scope', () => {
      assert.deepEqual(api.getScope(), validTrunkAndBranchScope)
    })
  })

  describe('.on("auth", callback)', () => {

    beforeEach(() => {
      api = apiFactory(validKeyCreds, validTrunkAndBranchScope)()
    })

    it('should throw if event is not supported', () => {
      assert.throws(() => { api.on('invalid', () => {}) }, InvalidArgumentError)
    })

    it('should throw if callback is not a function', () => {
      assert.throws(() => { api.on('auth', null) }, InvalidArgumentError)
    })

    it('should invoke the callback function on auth success', (done) => {
      mockapi.post(ApiPaths.log)
      api.on('auth', (err, token) => {
        assert.isNull(err)
        assert.equal(token, MOCK_AUTH_TOKEN)
        done()
      })
      api.log('trace', 'test')
    })

    it('should invoke the callback function on auth error', (done) => {
      mockapi.post('/developer/log', 401)
      api.on('auth', (err, token) => {
        assert.isNotNull(err)
        assert.isNull(token)
        done()
      })
      api.log('trace', 'test')
    })
  })

  describe('api endpoint requests', () => {
    beforeEach(() => {
      mockapi.post(ApiPaths.log)
    })

    it('should have response.headers.authorization when using Bearer creds', () => {
      return api.log('trace', 'valid').then(response => {
        const { headers } = response
        assert.equal(headers.authorization, MOCK_AUTH_TOKEN)
      })
    })

    it('should have response.headers.authorization when using Checksum creds', () => {
      return api.log('trace', 'valid').then(response => {
        const { headers } = response

        assert.equal(headers.authorization, MOCK_AUTH_TOKEN)
      })
    })
  })

  describe('api.log(level, message, [meta])', () => {

    beforeEach(() => {
      mockapi.post(ApiPaths.log)
    })

    it('should throw if log level is not supported', () => {
      assert.throws(() => { api.log('invalid', 'valid') }, InvalidArgumentError)
    })

    it('should throw if message is invalid', () => {
      const invalidMessages = [
        undefined,
        null,
        '',
        {},
        () => {}
      ]

      invalidMessages.forEach(message => {
        assert.throws(() => { api.log('trace', message) }, InvalidArgumentError)
      })
    })

    it('should throw if meta is invalid', () => {
      const invalidMeta = [
        null,
        '',
        () => {}
      ]

      invalidMeta.forEach(meta => {
        assert.throws(() => { api.log('trace', 'valid', meta) }, InvalidArgumentError)
      })
    })

    it('should post a message to the api', () => {
      return api.log('trace', 'valid').then(response => {
        const { body: { level, message, meta }, headers } = response

        assert.equal(headers.authorization, MOCK_AUTH_TOKEN)
        assert.equal('trace', level)
        assert.equal('valid', message)
        assert.equal(meta, undefined)
      })
    })

    it('should post a message and meta to the api', () => {
      return api.log('trace', 'valid', { sample: 'data' }).then(response => {
        const { body: { level, message, meta }, headers } = response

        assert.equal(headers.authorization, MOCK_AUTH_TOKEN)
        assert.equal(level, 'trace')
        assert.equal(message, 'valid')
        assert.deepEqual(meta, {'sample':'data'})
      })
    })
  })

  describe('api.experience', () => {

    describe('.bootstrap(id)', () => {

      const invalidIDs = [null, undefined, {}, '']
      invalidIDs.forEach((id) => {
        it(`should throw for id '${JSON.stringify(id)}'`, () => {
          assert.throws(() => { api.experience.bootstrap(id) }, InvalidArgumentError)
        })
      })

      const validIDs = ['123', '456']
      validIDs.forEach((id) => {
        const expected = ApiPaths.experience.bootstrap(id)
        it(`should build and GET uri: ${expected}'`, () => {
          const getManyMock = mockapi.get(expected)

          return api.experience.bootstrap(id).then(() => {
            getManyMock.done()
          })
        })
      })
    })
  })

  describe('api.organizations', () => {

    describe('.getOneByHostname(hostname)', () => {
      const invalidHostnames = [null, undefined, {}]
      invalidHostnames.forEach((hostname) => {
        it(`should throw for hostname '${hostname}'`, () => {
          assert.throws(() => { api.organizations.getOneByHostname(hostname) }, InvalidArgumentError)
        })
      })

      const validHostnames = ['www.domain.com', 'dealer.domain.com']
      validHostnames.forEach((hostname) => {
        const expected = expectedUri(ApiPaths.organizations.getOneByHostname(hostname))
        it(`should GET uri: ${expected}`, () => {
          const getOneByHostnameMock = mockapi.get(expected, 200)

          return api.organizations.getOneByHostname(hostname).then(() => {
            getOneByHostnameMock.done()
          })
        })
      })
    })

    describe('.getMany(filter)', () => {
      const invalidFilters = [null, undefined, {}]
      invalidFilters.forEach((filter) => {
        it(`should throw for filter '${JSON.stringify(filter)}'`, () => {
          assert.throws(() => { api.organizations.getMany(filter) }, InvalidArgumentError)
        })
      })

      const validFilters = [{ status: 'active' }, {IsTrunk: true}]
      validFilters.forEach((filter) => {
        const expected = expectedUri(ApiPaths.organizations.getMany(), filter)
        it(`should GET uri: ${expected}`, () => {
          const getManyMock = mockapi.get(expected, 200)

          return api.organizations.getMany(filter).then(() => {
            getManyMock.done()
          })
        })
      })
    })

    describe('.getOne(id)', () => {

      const invalidIDs = [null, undefined, {}, '']
      invalidIDs.forEach((id) => {
        it(`should throw for id '${JSON.stringify(id)}'`, () => {
          assert.throws(() => { api.organizations.getOne(id) }, InvalidArgumentError)
        })
      })

      const validIDs = ['123', '456']
      validIDs.forEach((id) => {
        const expected = ApiPaths.organizations.getOne(id)
        it(`should build and GET uri: ${expected}'`, () => {
          const getManyMock = mockapi.get(expected)

          return api.organizations.getOne(id).then(() => {
            getManyMock.done()
          })
        })
      })
    })
  })

  describe('api.locations', () => {

    describe('.getMany(filter)', () => {
      const invalidFilters = [null, undefined, {}]
      invalidFilters.forEach((filter) => {
        it(`should throw for filter '${JSON.stringify(filter)}'`, () => {
          assert.throws(() => { api.locations.getMany(filter) }, InvalidArgumentError)
        })
      })

      const validFilters = [{ status: 'active' }, {isPrimary: true}]
      validFilters.forEach((filter) => {
        const expected = expectedUri(ApiPaths.locations.getMany(validTrunkAndBranchScope), filter)
        it(`should GET uri: ${expected}`, () => {
          const getManyMock = mockapi.get(expected, 200)

          return api.locations.getMany(filter).then(() => {
            getManyMock.done()
          })
        })
      })
    })

    describe('.getOne(id)', () => {
      const invalidIDs = [null, undefined, {}, '']
      invalidIDs.forEach((id) => {
        it(`should throw for id '${JSON.stringify(id)}'`, () => {
          assert.throws(() => { api.locations.getOne(validTrunkAndBranchScope, id) }, InvalidArgumentError)
        })
      })

      const validIDs = ['123', '456']
      validIDs.forEach((id) => {
        const expected = ApiPaths.locations.getOne(validTrunkAndBranchScope, id)
        it(`should build and GET uri: ${expected}`, () => {
          const getManyMock = mockapi.get(expected)

          return api.locations.getOne(id).then(() => {
            getManyMock.done()
          })
        })
      })
    })
  })

  describe('api.content', () => {

    const contentType = 'PRODUCT'

    describe('.getMany(type, filter)', () => {
      const invalidTypes = [null, undefined, {}, '']
      invalidTypes.forEach((type) => {
        it(`should throw for type '${JSON.stringify(type)}'`, () => {
          assert.throws(() => { api.content.getMany(type, { status: 'active' }) }, InvalidArgumentError)
        })
      })

      const invalidFilters = [null, undefined, {}, '']
      invalidFilters.forEach((filter) => {
        it(`should throw for filter '${JSON.stringify(filter)}'`, () => {
          assert.throws(() => { api.content.getMany(contentType, filter) }, InvalidArgumentError)
        })
      })

      const validFilters = [{ status: 'active' }, {isPrimary: true}]
      validFilters.forEach((filter) => {
        const expected = expectedUri(ApiPaths.content.getMany(validTrunkAndBranchScope, contentType), filter)
        it(`should GET uri: ${expected}`, () => {
          const getManyMock = mockapi.get(expected)

          return api.content.getMany(contentType, filter).then(() => {
            getManyMock.done()
          })
        })
      })
    })

    describe('.getOne(type, id)', () => {

      const invalidTypes = [null, undefined, {}, '']
      invalidTypes.forEach((type) => {
        it(`should throw for type '${JSON.stringify(type)}'`, () => {
          assert.throws(() => { api.content.getOne(type, 'VALID_ID') }, InvalidArgumentError)
        })
      })

      const invalidIDs = [null, undefined, {}, '']
      invalidIDs.forEach((id) => {
        it(`should throw for id '${JSON.stringify(id)}'`, () => {
          assert.throws(() => { api.content.getOne('VALID_TYPE', id) }, InvalidArgumentError)
        })
      })

      const validIDs = ['123', '456']
      validIDs.forEach((id) => {
        const expected = ApiPaths.content.getOne(validTrunkAndBranchScope, contentType, id)
        it(`should build and GET uri: ${expected}`, () => {
          const getManyMock = mockapi.get(expected)

          return api.content.getOne(contentType, id).then(() => {
            getManyMock.done()
          })
        })
      })
    })

    describe('.getManyComplex(type, filter)', () => {
      const invalidTypes = [null, undefined, {}, '']
      invalidTypes.forEach((type) => {
        it(`should throw for type '${JSON.stringify(type)}'`, () => {
          assert.throws(() => { api.content.getManyComplex(type, { status: 'active' }) }, InvalidArgumentError)
        })
      })

      const invalidFilters = [null, undefined, {}, '']
      invalidFilters.forEach((filter) => {
        it(`should throw for filter '${JSON.stringify(filter)}'`, () => {
          assert.throws(() => { api.content.getManyComplex('products', filter) }, InvalidArgumentError)
        })
      })
    })

    describe('.aggregate(type, list, aggregate)', () => {
      const invalidTypes = [null, undefined, {}, '']
      invalidTypes.forEach((type) => {
        it(`should throw for type '${JSON.stringify(type)}'`, () => {
          assert.throws(() => { api.content.aggregate(type, {}, {}) }, InvalidArgumentError)
        })
      })

      const invalidLists = [null, undefined, '', {}]
      invalidLists.forEach((list) => {
        it(`should throw for list '${JSON.stringify(list)}'`, () => {
          assert.throws(() => { api.content.aggregate('product', list, { test: ''}) }, InvalidArgumentError)
        })
      })

      const invalidAggregates = [null, undefined, '', {}]
      invalidAggregates.forEach((aggregate) => {
        it(`should throw for aggregate '${JSON.stringify(aggregate)}'`, () => {
          assert.throws(() => { api.content.aggregate('product', { test: ''}, aggregate ) }, InvalidArgumentError)
        })
      })
      
    })
    
  })

  describe('api.composite', () => {

    describe('.query(query)', () => {

      const invalidQueries = [null, undefined, {}, '', () => {}]
      invalidQueries.forEach((query) => {
        it(`should throw for query '${JSON.stringify(query)}'`, () => {
          assert.throws(() => { api.composite.query(query) }, InvalidArgumentError)
        })
      })

      const validQueries = [
        {
          screen: {
            tenant: {
              _resourceDefined: true,
              _resource: 'tenants',
              _paramsRequested: true,
              _params: {
                activeContext: true
              },
              _singular: true
            }
          }
        }
      ]
      validQueries.forEach((query) => {
        const expected = expectedUri(ApiPaths.composite.query(validTrunkAndBranchScope))

        //it(`should POST uri: ${expected} with body ${JSON.stringify(query)}`, () => {
        it(`should POST uri: ${expected}`, () => {
          const getCompositeMock = mockapi.post(expected, 200, query)

          return api.composite.query(query).then(() => {
            getCompositeMock.done()
          })
        })
      })
    })
  })

  describe('api.metrics', () => {

    describe('.putPageview(data)', () => {

      const invalidDatum = [null, undefined, {}, '', () => {}]
      invalidDatum.forEach((data) => {
        it(`should throw for data '${JSON.stringify(data)}'`, () => {
          assert.throws(() => { api.metrics.putPageview(data) }, InvalidArgumentError)
        })
      })

      const validDatum = [
        {
          userAgent: 'userAgent',
          ipAddress: 'remoteAddress',
          URL: 'url',
          httpReferrer: 'document.referrer'
        },
        {
          anything: 'can',
          go: 'here',
          there: 'is',
          no: 'data validation'
        }
      ]

      validDatum.forEach((data) => {
        const expected = expectedUri(ApiPaths.metrics.putMetric(validTrunkAndBranchScope))
        it(`should PUT uri: ${expected}`, () => {
          const getMetricMock = mockapi.put(expected, 200, { type: 'pageview', data })

          return api.metrics.putPageview(data).then(() => {
            getMetricMock.done()
          })
        })
      })
    })
  })

  describe('api.carts', () => {
    const cartBaseUri = ApiPaths.carts(validTrunkAndBranchScope)
    const mockRequestBody = { mock: 'data' }

    const tests = [
      {
        name: '.get()',
        url: cartBaseUri,
        verb: 'GET',
        request: () => api.carts.get()
      },
      {
        name: '.post(...)',
        url: cartBaseUri+'/',
        verb: 'POST',
        body: mockRequestBody,
        request: () => api.carts.post(mockRequestBody)
      },
      {
        name: '.id(1).get()',
        url: `${cartBaseUri}/1`,
        verb: 'GET',
        request: () => api.carts.id(1).get()
      },
      {
        name: '.id(1).items.post(...)',
        url: `${cartBaseUri}/1/items/`,
        verb: 'POST',
        body: mockRequestBody,
        request: () => api.carts.id(1).items.post(mockRequestBody)
      },
      {
        name: '.id(1).items.id(2).patch(...)',
        url: `${cartBaseUri}/1/items/2`,
        verb: 'PATCH',
        body: mockRequestBody,
        request: () => api.carts.id(1).items.id(2).patch(mockRequestBody)
      },
      {
        name: '.id(1).contacts.post(...)',
        url: `${cartBaseUri}/1/contacts/`,
        verb: 'POST',
        body: mockRequestBody,
        request: () => api.carts.id(1).contacts.post(mockRequestBody)
      },
      {
        name: '.id(1).contacts.id(2).patch(...)',
        url: `${cartBaseUri}/1/contacts/2`,
        verb: 'PATCH',
        body: mockRequestBody,
        request: () => api.carts.id(1).contacts.id(2).patch(mockRequestBody)
      },
      {
        name: '.id(1).contacts.id(2).delete()',
        url: `${cartBaseUri}/1/contacts/2`,
        verb: 'DELETE',
        request: () => api.carts.id(1).contacts.id(2).delete()
      },
      {
        name: '.id(1).billTo.patch(...)',
        url: `${cartBaseUri}/1/billTo`,
        verb: 'PATCH',
        body: mockRequestBody,
        request: () => api.carts.id(1).billTo.patch(mockRequestBody)
      },
      {
        name: '.id(1).shipTo.patch(...)',
        url: `${cartBaseUri}/1/shipTo`,
        verb: 'PATCH',
        body: mockRequestBody,
        request: () => api.carts.id(1).shipTo.patch(mockRequestBody)
      },
      {
        name: '.id(1).confirmation.get()',
        url: `${cartBaseUri}/1/confirmation`,
        verb: 'GET',
        request: () => api.carts.id(1).confirmation.get()
      },
      {
        name: '.id(1).checkout.post(...)',
        url: `${cartBaseUri}/1/checkout`,
        verb: 'POST',
        request: () => api.carts.id(1).checkout.post(mockRequestBody)
      }
    ]

    tests.forEach(t => {
      describe(`${t.name}`, () => {

        it(`should issue a ${t.verb} request to ${t.url}`, () => {
          const scope = nock(DEFAULT_OPTIONS.url)
            .intercept(t.url, t.verb, t.body)
            .reply(200)

          return t.request().then(() => {
            scope.done()
          })
        })

      })
    })
  })

  describe('api.seach(query)', () => {
    const invalidQueries = [null, undefined, {}, '', () => {}]
    invalidQueries.forEach((query) => {
      it(`should throw for query '${JSON.stringify(query)}'`, () => {
        assert.throws(() => { api.search(query) }, InvalidArgumentError)
      })
    })

    const validQueries = [{query: {bool: true}}]

    validQueries.forEach((query) => {
      const expected = expectedUri(ApiPaths.search(validTrunkAndBranchScope))

      it(`should POST uri: ${expected}`, () => {
        const getSearchMock = mockapi.post(expected, 200)

        return api.search(query.query).then(() => {
          getSearchMock.done()
        })
      })
    })
  })

  describe('api.seach(query, params)', () => {
    const validQueries = [
      { params: undefined, query: { bool: true }},
      { params: { types: 'x,y'}, query: { bool: true }},
      { params: { types: 'x,y', from: 1, size: 10 }, query: { bool: true }}
    ]

    validQueries.forEach((query) => {
      const expected = expectedUri(ApiPaths.search(validTrunkAndBranchScope), query.params)

      it(`should POST uri: ${expected}`, () => {
        const getSearchMock = mockapi.post(expected, 200)

        return api.search(query.query, query.params).then(() => {
          getSearchMock.done()
        })
      })
    })
  })

  describe('api.locator(query)', () => {
    const invalidQueries = [null, undefined, {}, '', () => {}]
    invalidQueries.forEach((query) => {
      it(`should throw for query '${JSON.stringify(query)}'`, () => {
        assert.throws(() => { api.search(query) }, InvalidArgumentError)
      })
    })

    const validQueries = [
      {
        city: 'Saint Petersburg',
        stateProvince: 'FL',
        countToReturn: 100,
        radius: 100
      },
      {
        postalCode: '33701',
        countToReturn: 5,
        radius: 100
      }
    ]

    validQueries.forEach((query) => {
      const expected = expectedUri(ApiPaths.locator(validTrunkAndBranchScope))

      it(`should POST uri: ${expected}`, () => {
        const getLocatorMock = mockapi.post(expected, 200)

        return api.locator(query).then(() => {
          getLocatorMock.done()
        })
      })
    })
  })
})

// only used for assert output, not actual test
function expectedUri(path, query) {
  return path + (query && query ? '?' + stringify(query) : '')
}
