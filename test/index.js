import { assert } from 'chai'
import forteApi from '../src'
import { InvalidArgumentError } from '../src/util'

import nock from 'nock'
import mockapi, { MOCK_AUTH_TOKEN } from './mocks/pc6api'

const DEFAULT_OPTIONS = {
	url: 'https://api.pclocal.us',
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

	describe('ctor(credentials, scope, options)', () => {
		it('should throw if invalid credentials have been provided', () => {
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
				assert.throws(apiFactory(invalidCreds, validTrunkScope))
			})
		})

		it('should NOT throw if valid credentials have been provided', () => {
			assert.doesNotThrow(apiFactory(validTokenCreds, validTrunkScope))
			assert.doesNotThrow(apiFactory(validKeyCreds, validTrunkScope))
		})

		it('should throw if an invalid a trunk scope has been provided', () => {
			assert.throws(apiFactory(validTokenCreds, undefined))
			assert.throws(apiFactory(validTokenCreds, null))
			assert.throws(apiFactory(validTokenCreds, {}))
			assert.throws(apiFactory(validTokenCreds, { hostname: 'dealer.client.us', trunk: null }))
			assert.throws(apiFactory(validTokenCreds, { hostname: 'dealer.client.us', trunk: '' }))
		})

		it('should throw if an invalid a branch scope has been provided', () => {
			invalidBranchScopes.forEach(scope => {
				assert.throws(apiFactory(validTokenCreds, {trunk:'valid', branch: scope}))
			})
		})

		it('should throw if options are invalid', () => {
			let invalidOptions = [
				{ url: 0 },
				{ fingerPrintingEnabled: 'invalid' },
				{ url: 'valid', fingerPrintingEnabled: 'invalid' },
				{ url: 0, fingerPrintingEnabled: true }
			]
			invalidOptions.forEach(options => {
				assert.throws(apiFactory(validTokenCreds, validTrunkScope, options))	
			})
		})

		it('should NOT throw if options are valid', () => {
			let validOptions = [
				undefined,
				{ url: 'valid' },
				{ fingerPrintingEnabled: true },
				{ url: 'valid', fingerPrintingEnabled: true },
			]
			validOptions.forEach(options => {
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
					assert.throws(() => { api.withBranch(scope) })
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
			mockapi.post('/log')
		})

		afterEach(() => {
			nock.cleanAll()
		})

		it('should throw if event is not supported', () => {
			assert.throws(() => { api.on('invalid', () => {}) }, InvalidArgumentError)
		})

		it('should throw if callback is not a function', () => {
			assert.throws(() => { api.on('auth', null) }, InvalidArgumentError)
		})

		it('should invoke the callback function on auth success', (done) => {
			api.on('auth', (err, res) => {
				done()
			})
			api.log('trace', 'test')
		})

		it('should invoke the callback function on auth error')
	})

	describe('api endpoint requests', () => {
		beforeEach(() => {
			mockapi.post('/log')
		})

		afterEach(() => {
			nock.cleanAll()
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
			mockapi.post('/log')
		})

		afterEach(() =>{
			nock.cleanAll()
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
				assert.throws(() => { api.log('trace', 'valid', meta) })
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

		it('should post meta to the api', () => {
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
		describe('.getMany', () => {
			it('should throw if filter is null')
			describe('when a request succeeds, the return value', () => {
				it('should have a "response" property')
				it('should have a "response.data" property')
			})
			describe('when a request fails, the return value', () => {
				it('should have a "response" property')
				it('should have a "result" property')
			})
		})
		describe('.getOne', () => {
			it('should throw if filter is null')

		})
	})
})