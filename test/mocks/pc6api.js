import nock from 'nock'

export const MOCK_AUTH_TOKEN = 'FAKE_AUTH_TOKEN_FROM_NOCK'

const defaultOptions = {
	//allowUnmocked: true,
}

export default {
	get: (url, status = 200, response = '') => {
		return nock('http://api.pclocal.us', defaultOptions)
			.matchHeader('Authorization', matchRequestAuthHeader)
	    	.get(url)
	    	.reply(status, response, okHeaders)
	},
	post: (url, status = 200, body) => {
		return nock('http://api.pclocal.us', defaultOptions)
			.matchHeader('Authorization', matchRequestAuthHeader)
	    	.post(url, body)
	    	.reply(status, formatNockResponse, okHeaders)
	},
	put: (url, status = 200, body) => {
		return nock('http://api.pclocal.us', defaultOptions)
			.matchHeader('Authorization', matchRequestAuthHeader)
	    	.put(url, body)
	    	.reply(status, formatNockResponse, okHeaders)
	}
}

function formatNockResponse(uri, body) {
	return JSON.parse(body)
}

const okHeaders = {
	'Authorization': MOCK_AUTH_TOKEN,
}

function matchRequestAuthHeader(value) {
	return value === 'Bearer VALID_TOKEN' || /^Checksum VALID_PUBLICKEY:(\d+):([^:]+):(dealer\.client\.us)$/.test(value)
}
