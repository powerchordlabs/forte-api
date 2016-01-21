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

	let validTokenCreds = {bearerToken: 'Bearer valid'}
	let validKeyCreds = {privateKey: 'valid', publicKey: 'valid'}
	let validTrunkScope = { hostname: 'dealer.client.us', trunk: 'valid' }
	let validTrunkAndBranchScope = { hostname: 'dealer.client.us', trunk: 'valid', branch: 'valid' }
	let validOptions = {
		url: 'https://api.pclocal.us',
		fingerPrintingEnabled: true
	}

	let invalidBranchScopes = [null, '', 1, {}, () => {}]

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
		let api
		let branchApi
		
		beforeEach(() => {
			api = apiFactory(validTokenCreds, validTrunkAndBranchScope)()
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
		let api
		
		beforeEach(() => {
			api = apiFactory(validTokenCreds, validTrunkAndBranchScope)()
		})

		it('should return the api scope', () => {
			assert.deepEqual(api.getScope(), validTrunkAndBranchScope)
		})
	})

	describe('.on("auth", callback)', () => {
		let api
		
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
			api.on('auth', (err, res) => {
				assert.isNull(err)
				done()
			})
			api.log('trace', 'test')
		})

		it('should invoke the callback function on auth error', (done) => {
			mockapi.post('/developer/log', 401)
			api.on('auth', (err, res) => {
				assert.isNotNull(err)
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
			let api = apiFactory(validTokenCreds, validTrunkAndBranchScope)()

			return api.log('trace', 'valid').then(response => {
				let { headers } = response
				assert.equal(headers.authorization, MOCK_AUTH_TOKEN)
			})
		})

		it('should have response.headers.authorization when using Checksum creds', () => {
			let api = apiFactory(validKeyCreds, validTrunkAndBranchScope)()

			return api.log('trace', 'valid').then(response => {
				let { headers } = response

				assert.equal(headers.authorization, MOCK_AUTH_TOKEN)
			})
		})
	})

	describe('api.log(level, message, [meta])', () => {
		let api
		
		beforeEach(() => {
			api = apiFactory(validTokenCreds, validTrunkAndBranchScope)()
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
				let { data: { level, message, meta }, headers } = response

				assert.equal(headers.authorization, MOCK_AUTH_TOKEN)
				assert.equal('trace', level)
				assert.equal('valid', message)
				assert.equal(meta, undefined)
			})
		})

		it('should post a message and meta to the api', () => {
			return api.log('trace', 'valid', { sample: 'data' }).then(response => {
				let { data: { level, message, meta }, headers } = response

				assert.equal(headers.authorization, MOCK_AUTH_TOKEN)
				assert.equal(level, 'trace')
				assert.equal(message, 'valid')
				assert.deepEqual(meta, {"sample":"data"})
			})
		})
	})

	describe('api.organizations', () => {

		describe('.getMany(filter)', () => {
			let api

			beforeEach(() => {
				api = apiFactory(validTokenCreds, validTrunkAndBranchScope)()
			})

			let invalidFilters = [null, undefined, {}]
			invalidFilters.forEach((filter) => {
				it(`should throw for filter '${JSON.stringify(filter)}'`, () => {
					assert.throws(() => { api.organizations.getMany(filter) }, InvalidArgumentError)
				})
			})

			let validFilters = [{ status: 'active' }, {id: 1}]
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
			let api
			beforeEach(() => {
				api = apiFactory(validTokenCreds, validTrunkAndBranchScope)()
			})

			let invalidIDs = [null, undefined, {}, '']
			invalidIDs.forEach((id) => {
				it(`should throw for id '${JSON.stringify(id)}'`, () => {
					assert.throws(() => { api.organizations.getOne(id) }, InvalidArgumentError)
				})
			})

			let validIDs = ['123', '456']
			validIDs.forEach((id) => {
				it(`should build and GET uri: ${ApiPaths.organizations.getOne(id)}'`, () => {
					let getManyMock = mockapi.get(ApiPaths.organizations.getOne(id))

					return api.organizations.getOne(id).then(response => {
						getManyMock.done()
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
