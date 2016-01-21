import { stringify } from 'querystring'

export const ApiPaths = {
	log: '/developer/log',
	organizations: {
		getMany(filter) {
			//return `/organizations/?${stringify(filter)}`
			return `/organizations/`
		},
		getOne(id) {
			return `/organizations/${id}`
		}
	}
}

/*
ForteApi Routes

Locations:
getMany: 		/{service}/organizations/{trunk}/{branch}/locations/
getOne:	 	/{service}/organizations/{trunk}/{branch}/locations/{locationID}

Organizations:
getMany:		/organizations/
getOne:		/organizations/{branch}

Content:
getMany:		/{service}/{trunk}/{branch}/content/{resource_type}/
getOne:		/{service}/{trunk}/{branch}/content/{resource_type}/{id}

Composite:
query:		/composite

*/

export const InvalidArgumentError = function InvalidArgumentError(message) {
  this.name = 'InvalidArgumentError';
  this.message = message;
}

InvalidArgumentError.prototype = Object.create(Error.prototype);
InvalidArgumentError.prototype.constructor = InvalidArgumentError;