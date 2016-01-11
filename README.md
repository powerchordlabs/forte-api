# ForteAPI

### Fluently communicate with the Powerchord Forte REST API!

ForteAPI is a fluent api wrapper around the Powerchord Forte REST API that allows you to focus on the data you want, rather than urls and verbs used to get or update the data you want.

## Install

`$ npm install --save forte-api`

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
    * [Events](#events)
    * [Endpoints](#endpoints)
        * [log](#log)
        * [analytics](#analytics)
        * [composite](#composite)
        * [organizations](#organizations)
        * [locations](#locations)
* [RoadMap](#roadmap)

## Quick Start
An Isomorphic usage example:

#### server

``` js
import ForteApi from 'forte-api'

// a global to be injected in to your html markup
CLIENT_GLOBALS = {
    Organization: {
        ID: 'myorgid',
        parentID: 'myparentorgid'
    },
    BearerToken = null;
}

// create a new api instance using secret keys
let api = ForteApi( 
    {
        apiPrivateKey: 'myPrivateKey', 
        apiPublicKey: 'myPublicKey',
    },
    CLIENT_GLOBALS.Organization
)

// listen for authentication events to capture the token
api.on('auth', (err, token) => {
    if(err) {
        console.log('An api auth error occurred:', err)
        return
    }

    console.log('Api auth success:', token)
    CLIENT_GLOBALS.BearerToken = token
})

// the following call establishes a session and grabs data
// it will also trigger the 'auth' event which we are subscribed to above
let results = api.composite
    .query({...})
    .then(composed =>
        api.location.get(id).then(location => return { composed, location })
    )

// at the end of the render cycle, the GLOBAL is injected in to the client markup


```

#### client

``` js
import ForteApi from 'forte-api'

// presuming CLIENT_GLOBALS was injected in your markup by the server
let api = ForteApi( 
    {
        bearerToken: CLIENT_GLOBALS.BearerToken
    },
    CLIENT_GLOBALS.Organization
)


let results = api.composite
    .query({...})
    .then(composed =>
        api.location.get(id).then(location => return { composed, location })
    )
```

## API

### Constructor

#### ForteApi(credentials, organization, [options])
Creates an instance of the Forte Api.

``` js
import ForteApi from 'forte-api'
let api = ForteApi(credentials, organization, options);
```

* `credentials: object`  
Used to manage Authentication for api requests. 
    * `bearerToken: string`  
    Used by default if not null. The token will be added as an `Authorization` header for all endpoint requests. 
    * `privateKey: string`, `publicKey: string` **server-side only**  
    If `bearerToken` is null, an attempt will be made to use the `publicKey` and `privateKey` fields to generate a bearerToken for you. You can use the `on('auth', cb)` handler to subscribe to the 'auth' event and capture the bearerToken for later use, e.g. injecting the token in a client-side global.
* `organization: object`  
Used to automatically generate routes for your api requests.
    * `ID: string`
    * `parentID: string`   
* `options: object`  
    * `url: string`  
    `default: https://api.powerchord.io`  
    The base Api url.  
    * `fingerPrintingEnabled: boolean` **client-side only**  
    `default: true`  
    If true, performs a browser fingerprint, once per session, via a non-blocking background process, i.e. WebWorker.

The following examples show how you might create api instances for an isomorphic app on the server and client:
#####server
``` js
// a global to be injected in to your html markup for client-side use
CLIENT_GLOBALS = {
    // the org we are focused on
    Organization: { ID: 'myorgid', parentID: 'myparentorgid'}, 
    // placeholder for our token that will be populated via api.on('auth', cb)
    BearerToken = null;
}

// create a new api instance using secret keys
let api = ForteApi( 
    {
        apiPrivateKey: 'myPrivateKey', 
        apiPublicKey: 'myPublicKey',
    },
    CLIENT_GLOBALS.Organization
)

// check for err, else capture token
api.on('auth', (err, token) => {
    if(err) {
        console.log('An api auth error occurred:', err)
        return
    }

    console.log('Api auth success:', token)
    CLIENT_GLOBALS.BearerToken = token
})
```

#####client
``` js
// presuming CLIENT_GLOBALS was injected in your markup by the server
let api = ForteApi( 
    {
        bearerToken: CLIENT_GLOBALS.BearerToken
    },
    CLIENT_GLOBALS.Organization
)
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

An example using api.log:

``` js
import ForteApi from 'forte-api'
let api = ForteApi(credentials, organization, options);

try{
    // some bad code...
}catch(ex) {
    api.log.error(ex.message, ex.stack)
}
```

#### Log
##### api.log(level, message, [meta])

Writes a log `message`, and optional `meta` object, to the api at the specified `level`, where level is one of the following:
* trace, debug, info, warn, error, fatal

A few contrived examples:
``` js
import ForteApi from 'forte-api'
let api = ForteApi(credentials, organization, options);

api.log('info', 'I thought this was interesting...')
api.log('warn', 'This does not look good...')
api.log('error', 'This is bad man... really bad!', { exception: ex})
api.log('fatal', 'GAME OVER!!!', { exception: ex})
```

#### Organizations
##### api.organizations.getAll({filter}): [object]  
Returns all organizations matching the filter option(s).

```js
api.organizations.getAll({status: 'active'}) // return all active items
```

##### api.organizations.getOne({filter}): object  
Returns one organization matching the filter option(s). 

In the event your filter matches multple items, only the first one will be returned. 

```js
api.organizations.getOne({trunkID: '1'}) // return the item with trunkID=1
```

#### Locations


#### Analytics
##### api.analytics.track(events)

Writes analytic events to the platform API. You can track one or more events with one call.

``` js
api.analytics.track({ 
    'pageview': {
        title: 'Hello World', 
        location: 'http://my.site.com/welcome'
    }
})
```

###### Supported Events  

* `pageview`
    * title: required
    * location: required

##### api.analytics.track(type, meta)

Writes one of the [supported events](#supported-events) event using the specified type and meta.

``` js
api.analytics.track('pageview', {
        title: 'Hello World', 
        location: 'http://my.site.com/welcome'
    }
)
```

#### Composite
##### api.composite.query(query)

**advanced**

Composite is an endpoint that takes a multi-entity structured query and returns all entities via one network call. While you are free to use this method directly, the mechanics of composite are complicated. Using [forte-conductor TODO:ADDLINK](todo) is recommended.

## ROADMAP

Document and implement REST entity methods, e.g.:
```
api.location.get(123)
api.location.add({...})
api.location.update({...})
api.location.delete(123)
```
    
