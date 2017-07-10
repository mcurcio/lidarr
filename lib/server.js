'use strict';

const express = require('express');
const expressGraphql = require('express-graphql');

const {
	graphql,
	GraphQLSchema,
	GraphQLObjectType,
	GraphQLString
} = require('graphql');

module.exports =
class Server {
	constructor() {
		this._express = express();

		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'RootQueryType',
				fields: {
					hello: {
						type: GraphQLString,
						resolve() {
							return 'world';
						}
					}
				}
			})
		});

		this._express.use('/graphql', expressGraphql({
			schema,
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
