import nock from 'nock'

function formatNockResponse(uri, body) {
	return {
		path: uri,
		headers: this.req.headers,
		body: JSON.parse(body)
	};
}

export const log = 
	nock('https://api.pclocal.us')
    .post('/log')
    .reply(200, formatNockResponse);