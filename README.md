# forte-api


## API

### `new ForteApi(organization, [options])`
Creates an instance of the Forte Api.

* `organization: object`  
Used to automatically generate routes for your api requests.
* `options`  
The following options can be used to control the behavior of the api.  
    * `url: string`  
    The base Api url.  
    `Default: https://api.powerchord.io`
    * privateKey  
    If supplied with the `publicKey` option, the api will automatically request a new Bearer Token before the first call to an Api endpoint.
    * publicKey  
    The public key used with the `privateKey` option to initiaite a Bearer Token request.
    * bearerToken  
    If a Bearer Token is already available, typically when the server has already created a token and injected it in to the client markup, the Api will add this token as an `Authorization` header for all enpoint requests. 

### `forteApi.onAuth: (err, bearerToken) => {}`
When the api successfully creates a new Bearer Token session this method will be invoked with the new bearerToken value. If an error occured it will be returned via the err argument.

    // behavior:
        * forward fingerprint on first client request
        * add Auth header, either via an existing bearerToken or using the checksum pub/priv behavior
            // checksum = sha512(apiPrivateKey + apiPublicKey + UTCTimestamp)
            // Authorization: Checksum {apiPublicKey} {UTCTimestamp} {checksum}
    

