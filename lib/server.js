'use strict';

const express = require('express');
const expressGraphql = require('express-graphql');
//const schema = require('./graphql');

const {
  buildClientSchema,
  introspectionQuery,
  printSchema,
} = require('graphql/utilities');

module.exports =
class Server {
	constructor(db, logger) {
		this._db = db;
		this._logger = logger;

		const schema = require('./graphql')(this._db);

		// FIXME: find a better place for this
		const {graphql} = require('graphql');
		const fs = require('fs');
		graphql(schema, introspectionQuery).then((res) => {
			return new Promise((resolve, reject) => {
				let string = printSchema(buildClientSchema(res.data));
				fs.writeFile('schema.graphql', string, (e) => {
					if (e) return reject(e);
					resolve();
				});
			});
		});

		this._express = express();
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
