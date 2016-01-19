import nock from 'nock'

function formatNockResponse(uri, body) {
	return {
		path: uri,
		headers: this.req.headers,
		body: JSON.parse(body)
	};
}

export default {
	get: (url, status = 200) => {
		return nock('https://api.pclocal.us')
			.defaultReplyHeaders({
			    'Authorization': 'FAKE_AUTH_TOKEN_FROM_NOCK',
			  })
	    	.get(url)
	    	.reply(status, formatNockResponse);
	},
	post: (url, status = 200) => {
		return nock('https://api.pclocal.us')
	    	.post(url)
	    	.reply(status, formatNockResponse);
	}
}