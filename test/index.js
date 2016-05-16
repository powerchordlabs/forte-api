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
	function apiFactory(credentials, scope, options){
		let opts = {...DEFAULT_OPTIONS, ...options}
		return () => { 
			return forteApi(credentials, scope, opts)
		}
	}

	let validTokenCreds = {bearerToken: 'Bearer VALID_TOKEN'}
	let validKeyCreds = {privateKey: 'VALID_PRIVATEKEY', publicKey: 'VALID_PUBLICKEY'}
	let validTrunkScope = { hostname: 'dealer.client.us', trunk: 'VALID_TRUNK' }
	let validTrunkAndBranchScope = { hostname: 'dealer.client.us', trunk: 'VALID_TRUNK', branch: 'VALID_BRANCH' }
	let validOptions = {
		url: 'https://api.pclocal.us',
		fingerPrintingEnabled: true
	}

	let invalidBranchScopes = [null, '', 1, {}, () => {}]

	let api

	beforeEach(() => {
		api = apiFactory(validTokenCreds, validTrunkAndBranchScope)()
	})

	afterEach(() => {
		nock.cleanAll()
	})

	describe('ctor(credentials, scope, options)', () => {
		let invalidCredentials = [
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

		let invalidTrunkScopes = [
			undefined,
			null,
			{},
			{ hostname: 'dealer.client.us', trunk: null },
			{ hostname: 'dealer.client.us', trunk: '' }
		]
		invalidTrunkScopes.forEach(invalid =>{		
			it(`should throw for trunk scope ${JSON.stringify(invalid)}`, () => {
				assert.throws(apiFactory(validTokenCreds, invalid), InvalidArgumentError)
			})
		})

		it('should throw if an invalid a branch scope has been provided', () => {
			invalidBranchScopes.forEach(scope => {
				assert.throws(apiFactory(validTokenCreds, {trunk:'valid', branch: scope}), InvalidArgumentError)
			})
		})

		let invalidOptions = [
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

		let validOptions = [
			undefined,
			{ url: 'valid' },
			{ fingerPrintingEnabled: true },
			{ url: 'valid', fingerPrintingEnabled: true },
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
				let { headers } = response
				assert.equal(headers.authorization, MOCK_AUTH_TOKEN)
			})
		})

		it('should have response.headers.authorization when using Checksum creds', () => {
			return api.log('trace', 'valid').then(response => {
				let { headers } = response

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
			let invalidMessages = [
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
			let invalidMeta = [
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
				let { body: { level, message, meta }, headers } = response

				assert.equal(headers.authorization, MOCK_AUTH_TOKEN)
				assert.equal('trace', level)
				assert.equal('valid', message)
				assert.equal(meta, undefined)
			})
		})

		it('should post a message and meta to the api', () => {
			return api.log('trace', 'valid', { sample: 'data' }).then(response => {
				let { body: { level, message, meta }, headers } = response

				assert.equal(headers.authorization, MOCK_AUTH_TOKEN)
				assert.equal(level, 'trace')
				assert.equal(message, 'valid')
				assert.deepEqual(meta, {"sample":"data"})
			})
		})
	})

	describe('api.experience', () => {

		describe('.bootstrap(id)', () => {

			let invalidIDs = [null, undefined, {}, '']
			invalidIDs.forEach((id) => {
				it(`should throw for id '${JSON.stringify(id)}'`, () => {
					assert.throws(() => { api.experience.bootstrap(id) }, InvalidArgumentError)
				})
			})

			let validIDs = ['123', '456']
			validIDs.forEach((id) => {
				let expected = ApiPaths.experience.bootstrap(id)
				it(`should build and GET uri: ${expected}'`, () => {
					let getManyMock = mockapi.get(expected)

					return api.experience.bootstrap(id).then(response => {
						getManyMock.done()
					})
				})
			})
		})
	})

	describe('api.organizations', () => {

		describe('.getMany(filter)', () => {
			let invalidFilters = [null, undefined, {}]
			invalidFilters.forEach((filter) => {
				it(`should throw for filter '${JSON.stringify(filter)}'`, () => {
					assert.throws(() => { api.organizations.getMany(filter) }, InvalidArgumentError)
				})
			})

			let validFilters = [{ status: 'active' }, {IsTrunk: true}]
			validFilters.forEach((filter) => {
				let expected = expectedUri(ApiPaths.organizations.getMany(), filter)
				it(`should GET uri: ${expected}`, () => {
					let getManyMock = mockapi.get(expected, 200)

					return api.organizations.getMany(filter).then(response => {
						getManyMock.done()
					})
				})
			})
		})

		describe('.getOne(id)', () => {

			let invalidIDs = [null, undefined, {}, '']
			invalidIDs.forEach((id) => {
				it(`should throw for id '${JSON.stringify(id)}'`, () => {
					assert.throws(() => { api.organizations.getOne(id) }, InvalidArgumentError)
				})
			})

			let validIDs = ['123', '456']
			validIDs.forEach((id) => {
				let expected = ApiPaths.organizations.getOne(id)
				it(`should build and GET uri: ${expected}'`, () => {
					let getManyMock = mockapi.get(expected)

					return api.organizations.getOne(id).then(response => {
						getManyMock.done()
					})
				})
			})
		})
	})

	describe('api.locations', () => {

		describe('.getMany(filter)', () => {
			let invalidFilters = [null, undefined, {}]
			invalidFilters.forEach((filter) => {
				it(`should throw for filter '${JSON.stringify(filter)}'`, () => {
					assert.throws(() => { api.locations.getMany(filter) }, InvalidArgumentError)
				})
			})

			let validFilters = [{ status: 'active' }, {isPrimary: true}]
			validFilters.forEach((filter) => {
				let expected = expectedUri(ApiPaths.locations.getMany(validTrunkAndBranchScope), filter)
				it(`should GET uri: ${expected}`, () => {
					let getManyMock = mockapi.get(expected, 200)

					return api.locations.getMany(filter).then(response => {
						getManyMock.done()
					})
				})
			})
		})

		describe('.getOne(id)', () => {
			let invalidIDs = [null, undefined, {}, '']
			invalidIDs.forEach((id) => {
				it(`should throw for id '${JSON.stringify(id)}'`, () => {
					assert.throws(() => { api.locations.getOne(validTrunkAndBranchScope, id) }, InvalidArgumentError)
				})
			})

			let validIDs = ['123', '456']
			validIDs.forEach((id) => {
				let expected = ApiPaths.locations.getOne(validTrunkAndBranchScope, id)
				it(`should build and GET uri: ${expected}`, () => {
					let getManyMock = mockapi.get(expected)

					return api.locations.getOne(id).then(response => {
						getManyMock.done()
					})
				})
			})
		})
	})

	describe('api.content', () => {

		const contentType = 'PRODUCT'

		describe('.getMany(type, filter)', () => {
			let invalidTypes = [null, undefined, {}, '']
			invalidTypes.forEach((type) => {
				it(`should throw for type '${JSON.stringify(type)}'`, () => {
					assert.throws(() => { api.content.getMany(type, { status: 'active' }) }, InvalidArgumentError)
				})
			})

			let invalidFilters = [null, undefined, {}, '']
			invalidFilters.forEach((filter) => {
				it(`should throw for filter '${JSON.stringify(filter)}'`, () => {
					assert.throws(() => { api.content.getMany(contentType, filter) }, InvalidArgumentError)
				})
			})

			let validFilters = [{ status: 'active' }, {isPrimary: true}]
			validFilters.forEach((filter) => {
				let expected = expectedUri(ApiPaths.content.getMany(validTrunkAndBranchScope, contentType), filter)
				it(`should GET uri: ${expected}`, () => {
					let getManyMock = mockapi.get(expected)

					return api.content.getMany(contentType, filter).then(response => {
						getManyMock.done()
					})
				})
			})
		})

		describe('.getOne(type, id)', () => {

			let invalidTypes = [null, undefined, {}, '']
			invalidTypes.forEach((type) => {
				it(`should throw for type '${JSON.stringify(type)}'`, () => {
					assert.throws(() => { api.content.getOne(type, 'VALID_ID') }, InvalidArgumentError)
				})
			})

			let invalidIDs = [null, undefined, {}, '']
			invalidIDs.forEach((id) => {
				it(`should throw for id '${JSON.stringify(id)}'`, () => {
					assert.throws(() => { api.content.getOne('VALID_TYPE', id) }, InvalidArgumentError)
				})
			})

			let validIDs = ['123', '456']
			validIDs.forEach((id) => {
				let expected = ApiPaths.content.getOne(validTrunkAndBranchScope, contentType, id)
				it(`should build and GET uri: ${expected}`, () => {
					let getManyMock = mockapi.get(expected)

					return api.content.getOne(contentType, id).then(response => {
						getManyMock.done()
					})
				})
			})
		})
	})

	describe('api.composite', () => {

		describe('.query(query)', () => {

			let invalidQueries = [null, undefined, {}, '', () => {}]
			invalidQueries.forEach((query) => {
				it(`should throw for query '${JSON.stringify(query)}'`, () => {
					assert.throws(() => { api.composite.query(query) }, InvalidArgumentError)
				})
			})

			let validQueries = [
				{ 
					"screen": { 
					"tenant": { 
						"_resourceDefined": true, 
						"_resource": "tenants", 
						"_paramsRequested": true, 
						"_params": { 
							"activeContext": true 
						}, 
						"_singular": true 
					}
					}
				}
			]
			validQueries.forEach((query) => {
				let expected = expectedUri(ApiPaths.composite.query(validTrunkAndBranchScope))
				//it(`should POST uri: ${expected} with body ${JSON.stringify(query)}`, () => {
				it(`should POST uri: ${expected}`, () => {
					let getCompositeMock = mockapi.post(expected, 200, query)

					return api.composite.query(query).then(response => {
						getCompositeMock.done()
					})
				})
			})
		})
	})

	describe('api.metrics', () => {

		describe('.putPageview(data)', () => {

			let invalidDatum = [null, undefined, {}, '', () => {}]
			invalidDatum.forEach((data) => {
				it(`should throw for data '${JSON.stringify(data)}'`, () => {
					assert.throws(() => { api.metrics.putPageview(data) }, InvalidArgumentError)
				})
			})

			let validDatum = [
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
				let expected = expectedUri(ApiPaths.metrics.putMetric(validTrunkAndBranchScope))
				it(`should PUT uri: ${expected}`, () => {
					let getMetricMock = mockapi.put(expected, 200, { type: 'pageview', data })

					return api.metrics.putPageview(data).then(response => {
						getMetricMock.done()
					})
				})
			})
		})
	})
})

// only used for assert output, not actual test
function expectedUri(path, query) {
	return path + (query ? '?' + stringify(query) : '')
}
