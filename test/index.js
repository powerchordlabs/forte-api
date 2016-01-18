import { assert } from 'chai'
import forteApi from '../src'
import { InvalidArgumentError } from '../src/util'

describe('forteApi', () => {
	function apiFactory(){
		let args = arguments
		return () => { 
			return forteApi.apply(null, args)
		}
	}

	let validTokenCreds = {bearerToken: 'valid'}
	let validKeyCreds = {privateKey: 'valid', publicKey: 'valid'}
	let validTrunkScope = { trunk: 'valid' }
	let validTrunkAndBranchScope = { trunk: 'valid', branch: 'valid' }

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
		})

		it('should throw if an invalid a branch scope has been provided', () => {
			invalidBranchScopes.forEach(scope => {
				assert.throws(apiFactory(validTokenCreds, {trunk:'valid', branch: scope}))
			})
		})

		it('should throw if options are invalid', () => {
			let invalidOptions = [
				{},
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
			api = apiFactory(validTokenCreds, validTrunkAndBranchScope)()
		})

		it('should throw if event is not supported', () => {
			assert.throws(() => { api.on('invalid', () => {}) }, InvalidArgumentError)
		})

		it('should throw if callback is not a function', () => {
			assert.throws(() => { api.on('auth', null) }, InvalidArgumentError)
		})

		it('should invoke the callback function on auth success')
		it('should invoke the callback function on auth error')
	})

	describe('api.log(level, message, [meta])', () => {
		let api
		
		beforeEach(() => {
			api = apiFactory(validTokenCreds, validTrunkAndBranchScope)()
		})

		it('should throw if log level is invalid', () => {
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

		it('should post to the api.log uri')
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