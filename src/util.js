import { stringify } from 'querystring'
require('extend-error')

/*
ForteApi Routes

Locations:
getMany: 	/{service}/organizations/{trunk}/{branch}/locations/
getOne:	 	/{service}/organizations/{trunk}/{branch}/locations/{locationID}

Organizations:
getMany:	/organizations/
getOne:		/organizations/{branch}

Content:
getMany:	/{service}/{trunk}/{branch}/content/{resource_type}/
getOne:		/{service}/{trunk}/{branch}/content/{resource_type}/{id}

Composite:
query:		/composite

*/

export const ApiPaths = {
	log: '/developer/log',
	experience: {
		bootstrap(id) {
			return `/organizations/${id}/bootstrap`
		}
	},
	organizations: {
		getMany() {
			return `/organizations/`
		},
		getOne(id) {
			return `/organizations/${id}`
		}
	},
	locations: {
		getMany(scope) {
			return `/forte/organizations/${scope.trunk}/${scope.branch}/locations/`
		},
		getOne(scope, id) {
			return `/forte/organizations/${scope.trunk}/${scope.branch}/locations/${id}`
		}
	},
	content: {
		getMany(scope, type) {
			return `/forte/${scope.trunk}/${scope.branch}/content/${type}/`
		},
		getOne(scope, type, id) {
			return `/forte/${scope.trunk}/${scope.branch}/content/${type}/${id}`
		}
	},
	composite: {
		query: '/composite'
	}
}

export const InvalidArgumentError = Error.extend('InvalidArgument');
