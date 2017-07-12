'use strict';

const {attributeFields, defaultArgs, defaultListArgs, resolver} = require('graphql-sequelize');

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

module.exports = (db) => {
	const Location = new graphql.ObjectType({
		name: "Location",
		description: "Location of photo",
		fields: () => Object.assign(attributeFields(db.Location), {
			photo: {
				type: Photo,
				description: "The photo this location holds",
				resolve: resolver(db.Location.Photo)
			}
		})
	});

	const Photo = new graphql.ObjectType({
		name: "Photo",
		description: "A photo",
		fields: Object.assign(attributeFields(db.Photo), {
			locations: {
				type: new graphql.List(Location),
				resolve: resolver(db.Photo.Locations)
			}
		})
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


