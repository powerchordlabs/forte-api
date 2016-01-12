var assert = require('chai').assert

describe('forteApi', function(){
	describe('constructor', function(){
		it('should verify that credentials have been provided')
		it('should throw an error if fingerPrintingEnabled is true on the server')
	})
	describe('api.on', function(){
		it('should throw an error if callback is not a function')
		it('should invoke the callback function on auth success')
		it('should invoke the callback function on auth error')
	})
	describe('api.log', function(){
		it('should throw an error if an invalid log level is used')
		it('should throw an error if an invalid log message is used')
		it('should throw an error if meta is supplied, but it is not an object')
	})
})