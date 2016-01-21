import nock from 'nock'

export const MOCK_AUTH_TOKEN = 'FAKE_AUTH_TOKEN_FROM_NOCK'

const defaultOptions = {
	//allowUnmocked: true,
}

export default {
	get: (url, status = 200, mockResponse) => {
		return nock('https://api.pclocal.us', defaultOptions)
			.matchHeader('Authorization', matchRequestAuthHeader)
	    	.get(url)
	    	.reply(status, mockResponse, okHeaders)
	},
	post: (url, status = 200) => {
		return nock('https://api.pclocal.us', defaultOptions)
			.matchHeader('Authorization', matchRequestAuthHeader)
	    	.post(url)
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
	return value === 'Bearer valid' || /^Checksum valid:(\d+):([^:]+):(dealer\.client\.us)$/.test(value)
}
