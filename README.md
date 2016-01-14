# ForteAPI

### Fluently communicate with the Powerchord Forte REST API!

ForteAPI is a fluent api wrapper around the Powerchord Forte REST API that allows you to focus on the data you want, rather than urls and verbs used to get or update the data you want.

## Install

`$ npm i -S forte-api`

## Features

* **Fluent API**  
The fluent API simplifies REST API access so you can focus on data and not HTTP
* **Semi-Automatic token auth**  
You simply provide secret keys, or a pre-existing token and ForteApi does the rest
* **Client Fingerprinting**  
By default ForteApi will perform a browser fingerprint on the client via a non-blocking background process, i.e. WebWorker. This can be disabled via options if legal requirements dictate.

# Documentation
* [Quick Start](#quick-start)  
* [API](#api)
    * [Constructor](#constructor)
      * [Organization Scopes](#organization-scopes)
    * [Events](#events)
    * [Endpoints](#endpoints)
        * [log](#log)
        * [organizations](#organizations)
        * [analytics](#analytics)
        * [composite](#composite)

## Quick Start
An Isomorphic usage example:

##### server.js
``` js
import ForteApi from 'forte-api'

// a global to be injected in to your html markup
CLIENT_GLOBALS = {
    scope: {
        trunk: 'TRUNKID'
        branch: 'BRANCHID',
    },
    BearerToken = null;
}

let creds = {
  apiPrivateKey: 'PRIVATEKEY', 
  apiPublicKey: 'PUBLICKEY',
}

// create a new api instance using secret keys
let api = ForteApi(creds, CLIENT_GLOBALS.scope)

// listen for authentication events to capture the token
api.on('auth', (err, token) => {
    if(err) {
        console.log('An api auth error occurred:', err)
        return
    }

    console.log('Api auth success:', token)
    CLIENT_GLOBALS.BearerToken = token
})

app.get('*', function(req, res, next) => {
  res.send(ReactDOM.renderToString(<App api={api} />))
})
```

##### client.js
``` js
import ForteApi from 'forte-api'

// presuming CLIENT_GLOBALS was injected in your markup by the server
let creds = { bearerToken: CLIENT_GLOBALS.BearerToken }

let api = ForteApi(creds, CLIENT_GLOBALS.scope)

ReactDOM.render(<App api={api} />, document.getElementById('app'));
```

##### app.js
``` js

let results = api.composite
    .query({...})
    .then(composed =>
        return api.location.get(id)
          .then(location => return { 
            composed.data, 
            location.data
          })
    )
```


## API

### Constructor

#### ForteApi(credentials, scope, [options])
Creates an instance of the Forte Api.

``` js
import ForteApi from 'forte-api'

let scope = {
  trunk: 'TRUNKID',
  branch: 'BRANCHID'
}

// defaults
let api = ForteApi(credentials, scope); 

// override api options
let api = ForteApi(credentials, scope, options); 
```

###### args
* `credentials: {Object}`  
Used to manage Authentication for api requests. 
    * `bearerToken: {string}`  
    Used by default if not null. The token will be added as an `Authorization` header for all endpoint requests. 
    * `privateKey: {string}`, `publicKey: {string}` **server-side only**  
    If `bearerToken` is null, an attempt will be made to use the `publicKey` and `privateKey` fields to generate a bearerToken for you. You can use the `on('auth', cb)` handler to subscribe to the 'auth' event and capture the bearerToken for later use, e.g. injecting the token in a client-side global.
* `scope: {Object}`  
  * `trunk: {string}`  
  Sets the trunk scope for all requests. See [Organization Scopes](#organization-scopes)
  * `branch: {string}`  
  Optional: sets the branch scope for all requests. Note, that an error will be thrown if `branch` is null when accessing endpoints that require it. See [Organization Scopes](#organization-scopes)
* `options: {Object}`  
    * `url: {string}`  
    `default: https://api.powerchord.io`  
    The base Api url.  
    * `fingerPrintingEnabled: {boolean}` **client-side only**  
    `default: true`  
    If true, performs a browser fingerprint, once per session, via a non-blocking background process, i.e. WebWorker.

### Organization Scopes
All api requests require at least a `trunk` scope and most also require a `branch` scope to be able to access your data. 

The [constructor](#constructor) requires a `scope.trunk` param, but for requests requiring `branch` scope you can also use `api.withBranch()`. This is particularly useful on the server side, where you may have non-branch api calls during bootstrapping, as well as branch scoped calls during individual page requests.

```js

var creds = {...}
var scope = { trunk: 'TRUNKID' } // note the lack of a branch

var api = ForteApi(creds, scope, opts)

// do some non-branch calls via lifecycle middleware...
app.use(lifecycle(api))

app.get('*', (req, res, next) => {
  // create a branch-scoped api instance for the app to use
  branchApi = api.withBranch(req.lifecycle.scope.branch)

  render(<App api={branchApi} />)
})
```

#### api.withBranch(ID)
A convenience method that creates a new api scoped to the specified `ID`. All configuration is replicated from the original api instance.

###### args:
* `ID: {string}`  
The identifier of the `branch` that future request should be scoped to.

```js
var scope = { trunk: 'TRUNKID' }
var api = ForteApi(creds, scope).withBranch('BRANCHID')

```

Or the equivalent:
```js
var scope = { trunk: 'TRUNKID', branch: 'BRANCHID' }
var api = ForteApi(creds, scope)
```

### Events

#### api.on('auth', callback(err, token))
When the api successfully creates a new Bearer Token session this method will be invoked with the new bearerToken value. If an error occured it will be returned via the err argument.

``` js
import ForteApi from 'forte-api'
let api = ForteApi(credentials, organization, options);

api.on('auth', (err, token) => {
    if(err) {
        console.log('An api auth error occurred:', err)
        return
    }
    console.log('Api auth success:', bearerToken)

    CLIENT_SIDE_GLOBALS.BearerToken = bearerToken
})
```

### Endpoints

Endpoints are the main progamming point for api data access. They are the fluent abstractions of the REST API endpoints. All of the endpoints return promises to allow chaining.

```js
api.organizations.getOne('orgid').then(
  (response) => {
    console.log('success:', response.data)
  },
  (response) => {
    console.log('error:', response.statusText)
  }
)
```

##### Responses
All Endpoints return promises that have the following response signature for both `success/error` handlers:

* `data: {string|Object}`  
The deserialized response body.
* `status: {number}`  
HTTP status code of the response.
* `statusText: {string}`  
HTTP status text of the response.
* `headers: {Object}`  
HTTP headers of the response.

#### Log
##### api.log(level, message, [meta])

Writes a log message to the PowerChord platform.

###### args:
* `level: {string}`  
The log level.  
*supported values:* `trace, debug, info, warn, error, fatal`  
* `message: {string}`  
The message to write.  
* `meta: {Object}`  
An optional json object to write.

``` js
import ForteApi from 'forte-api'
let api = ForteApi(credentials, organization, options);

api.log('info', 'I thought this was interesting...')
api.log('warn', 'This does not look good...')
api.log('error', 'This is bad man... really bad!', { exception: ex})
api.log('fatal', 'GAME OVER!!!', { exception: ex})
```

#### Organizations
##### api.organizations.getMany(filter): [{organization}, ...]
Returns an array of organization objects matching the `filter` option(s).

###### args:
* `filter: {Object}`  
A json object that is used to filter results from the api.

```js
// return all active items
api.organizations.getMany({status: 'active'}).then((response) => {
  console.log('organziations:', response.data)
})
```

##### api.organizations.getOne(filter): {organization}  
Returns one organization matching the filter option(s). In the event your filter matches multple items, only the first one will be returned. 

###### args:
* `filter: {string|Object}`  
A string trunkID or a json object that is used to filter results from the api.

```js
// return the item with trunkID=1
api.organizations.getOne('1').then((response) => {
  console.log('organziation:', response.data)
})

// is equivalent to
api.organizations.getOne({trunkID: '1'}).then((response) => {
  console.log('organziation:', response.data)
})
```

#### Analytics
##### api.analytics.track(events)

Writes events to the platform API.

###### args:
* `events: {Object}`  
A json object containing one or more [supported events](#supported-analytics-events).


``` js
api.analytics.track({ 
    'pageview': {
        title: 'Hello World', 
        location: 'http://my.site.com/welcome?u=me'
    }
})
```

###### Supported Analytics Events  

##### pageview  
* `title: {string}`  
The title of the page.
* `location: {string}`   
The full url of the page excluding the hash.

``` js
api.analytics.track({ 
    'pageview': {
        title: 'Hello World', 
        location: 'http://my.site.com/welcome?u=me'
    }
})
```

#### Composite
*advanced topic*  

##### api.composite.query(query)
Composite is an endpoint that takes a multi-entity structured query and returns all entities via one network call. While you are free to use this method directly, the mechanics of composite are complicated. Using [forte-conductor](https://github.com/powerchordinc/forte-conductor) is recommended.

###### args:
* `query: {Object}`  

```js
api.composite.query({
  "screen": {
    "tenant": {
      "_resourceDefined": true,
      "_resource": "tenants",
      "_paramsRequested": true,
      "_params": {
        "activeContext": true
      },
      "_singular": true
    },
    "storeNewsContent": {
      "_resourceDefined": true,
      "_resource": "content",
      "_paramsRequested": true,
      "_params": {
        "key": "cmssn"
      },
      "_singular": true
    },
    "fma": {
      "_resourceDefined": true,
      "_resource": "content-fma",
      "_paramsRequested": false,
      "_params": {
        
      },
      "_singular": false
    },
    "featuredProducts": {
      "_resourceDefined": true,
      "_resource": "products",
      "_paramsRequested": true,
      "_params": {
        "featured": true
      },
      "_singular": false
    }
  })
```    
