'use strict';

const {
	attributeFields,
	defaultArgs,
	defaultListArgs,
	relay,
	resolver
} = require('graphql-sequelize');

const _graphql = require('graphql');
const graphql = {};
for (let key in _graphql) {
	if (_graphql.hasOwnProperty(key)) {
		if (key.startsWith("GraphQL")) {
			let newKey = key.substr(7);
			graphql[newKey] = _graphql[key];
		}
	}
}

const graphQlRelay = require('graphql-relay');
const globalIdField = graphQlRelay.globalIdField;

module.exports = (db) => {
	const {
		nodeInterface,
		nodeField,
		nodeTypeMapper
	} = relay.sequelizeNodeInterface(db);

	const Location = new graphql.ObjectType({
		name: "Location",
		description: "Location of photo",
		fields: () => Object.assign(attributeFields(db.Location), {
			id: globalIdField(db.Location.id),
			photo: {
				type: Photo,
				description: "The photo this location holds",
				resolve: resolver(db.Location.Photo)
			}
		})
	});

	const PhotoLocation = relay.sequelizeConnection({
		name: 'PhotoLocation',
		nodeType: Location,
		target: db.Photo.Locations
	});

	const Photo = new graphql.ObjectType({
		name: "Photo",
		description: "A photo",
		fields: Object.assign(attributeFields(db.Photo), {
			id: globalIdField(db.Photo.id),
			locations: {
				type: PhotoLocation.connectionType,
				args: PhotoLocation.connectionArgs,
				resolve: resolver(db.Photo.Locations)
			}
		}),
		interfaces: [nodeInterface]
	});

	return new graphql.Schema({
		query: new graphql.ObjectType({
			name: 'RootQueryType',
			fields: {
				photos: {
					type: new graphql.List(Photo),
					args: defaultListArgs(),
					resolve: resolver(db.Photo)
				}
			}
		})
	});
};
