var assert = require('chai').assert

describe('forteApi', function(){
	describe('constructor', function(){
		it('should verify that credentials have been provided')
		it('should verify that a trunk scope has been provided')
		it('should warn if fingerPrintingEnabled is true on the server')
	})
	describe('api.on', function(){
		it('should throw an error if callback is not a function')
		it('should invoke the callback function on auth success')
		it('should invoke the callback function on auth error')
	})
	describe('api.log', function(){
		it('should throw an error if log level is invalid')
		it('should throw an error if message is invalid')
		it('should throw an error if meta is supplied, but it is not an object')
	})
	describe('api.organizations', function(){
		describe('.getMany', function(){
			it('should throw an erorr if filter is null')
			describe('when a request succeeds, the return value', function(){
				it('should have a "response" property')
				it('should have a "result" property')
			})
		})
		describe('.getOne', function(){
			it('should ')
		})
	})
})