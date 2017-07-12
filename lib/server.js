'use strict';

const express = require('express');
const expressGraphql = require('express-graphql');
const graphqlSequelize = require('graphql-sequelize');

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

const schema = (db) => {
	const Location = new graphql.ObjectType({
		name: "Location",
		description: "Location of photo",
		fields: () => { return {
			id: {
				type: new graphql.NonNull(graphql.Int),
				description: "The ID of the location"
			},
			path: {
				type: graphql.String,
				description: "The path of the location"
			},
			photo: {
				type: Photo,
				description: "The photo this location holds",
				resolve: graphqlSequelize.resolver(db.Location.Photo)
			}
		}}
	});

	const Photo = new graphql.ObjectType({
		name: "Photo",
		description: "A photo",
		fields: {
			id: {
				type: new graphql.NonNull(graphql.Int),
				description: "The ID of the photo"
			},
			locations: {
				type: new graphql.List(Location),
				resolve: graphqlSequelize.resolver(db.Photo.Locations)
			}
		}
	});

	return new graphql.Schema({
		query: new graphql.ObjectType({
			name: 'RootQueryType',
			fields: {
				hello: {
					type: graphql.String,
					resolve() {
						return 'world';
					}
				},
				photos: {
					type: new graphql.List(Photo),
					args: {
						limit: {
							type: graphql.Int
						},
						order: {
							type: graphql.String
						}
					},
					resolve: graphqlSequelize.resolver(db.Photo)
				}
			}
		})
	});
};

module.exports =
class Server {
	constructor(db, logger) {
		this._db = db;
		this._logger = logger;

		this._express = express();
		this._express.use('/graphql', expressGraphql({
			schema: schema(this._db),
			graphiql: true
		}));
	}

	start(port) {
		return new Promise((resolve, reject) => {
			this._express.listen(port, (err) => {
				if (err) return reject(err);
				resolve();
			});
		});
	}
};
