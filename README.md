# ForteAPI

### Fluently communicate with the Powerchord Forte REST API!

ForteAPI is a fluent api wrapper around the Powerchord Forte REST API that allows you to focus on the data you want, rather than urls and verbs used to get or update the data you want.

## Install

`$ npm install --save forte-api`

## Usage: es6 style

### server

``` js
import ForteApi from 'forte-api'

// a global like this should be injected in to your html markup 
// for use by the client-side code
CLIENT_SIDE_GLOBALS = {
    Organization: {
        ID: 'myorgid',
        parentID: 'myparentorgid'
    },
    BearerToken = null;
}

// listen for authentication events to capture the bearerToken for
// client-side injection...
let onAuth(err, bearerToken) => {
    if(err) {
        console.log('An api auth error occurred:', err)
        return
    }
    console.log('Api auth success:', bearerToken)

    CLIENT_SIDE_GLOBALS.BearerToken = bearerToken
}

let apiClient = new ForteApi( 
    {
        apiPrivateKey: 'myPrivateKey', 
        apiPublicKey: 'myPublicKey',
    },
    CLIENT_SIDE_GLOBALS.Organization,
    { 
        onAuth: onAuth
    }
)

... 

apiClient.composite
    .get({q})
    .then(composed =>
        api.location.get(id).then(location => return { composed, location })
    )
```

### client

``` js
import ForteApi from 'forte-api'

// presuming CLIENT_SIDE_GLOBALS was injected in your markup by the server
let apiClient = new ForteApi( 
    {
        bearerToken: CLIENT_SIDE_GLOBALS.BearerToken
    },
    CLIENT_SIDE_GLOBALS.Organization
)

... 

apiClient.composite
    .get({q})
    .then(composed =>
        api.location.get(id).then(location => return { composed, location })
    )
```

## API

### `ForteApi(credentials, organization, [options])`
Creates an instance of the Forte Api.

```
var ForteApi = require('forte-api');
var api = ForteApi(credentials, organization, options);
```

* `credentials: object`  
Used to manage Authentication for api requests. 
    * `bearerToken: string`  
    Used by default if not null. The token will be added as an `Authorization` header for all endpoint requests. 
    * `privateKey: string`, `publicKey: string` **server-side only**  
    If `bearerToken` is null an attempt will be made to use the `publicKey` and `privateKey` fields to generate a bearerToken for you. You can use the `on('auth', cb)` handler to subscribe to the 'auth' event and capture the bearerToken for later use, e.g. injecting the token in a client-side global.
* `organization: object`  
Used to automatically generate routes for youfunctionr api requests.
    * `ID: string`
    * `parentID: string`   
* `options: object`  
    * `url: string`  
    `default: https://api.powerchord.io`  
    The base Api url.  
    
### Events

### `forteApi.on('auth', callback(err, token))`
When the api successfully creates a new Bearer Token session this method will be invoked with the new bearerToken value. If an error occured it will be returned via the err argument.

``` js
var ForteApi = require('forte-api');
var api = ForteApi(credentials, organization, options);

api.on('auth', (err, token) => {
    if(err) {
        console.log('An api auth error occurred:', err)
        return
    }
    console.log('Api auth success:', bearerToken)

    CLIENT_SIDE_GLOBALS.BearerToken = bearerToken
})
```

## ROADMAP


```
api.composite.query({...})

api.location.get(123)
api.location.add({...})
api.location.update({...})
api.location.delete(123)

api.locations.query({...})

api.locations('get', { status: active })

    // behavior:
        * forward fingerprint on first client request
        * add Auth header, either via an existing bearerToken or using the checksum pub/priv behavior
            // checksum = sha512(apiPrivateKey + apiPublicKey + UTCTimestamp)
            // Authorization: Checksum {apiPublicKey} {UTCTimestamp} {checksum}
```
