'use strict';

const express = require('express');
const expressGraphql = require('express-graphql');
const path = require('path');

const {
  buildClientSchema,
  introspectionQuery,
  printSchema,
} = require('graphql/utilities');

module.exports =
class Server {
	constructor(db, logger, env) {
		this._db = db;
		this._logger = logger;

		const schema = require('./graphql')(this._db);

		/*
		// FIXME: find a better place for this
		const {graphql} = require('graphql');
		const fse = require('fs-extra');
		graphql(schema, introspectionQuery).then((res) => {
			return new Promise((resolve, reject) => {
				fse.writeJson('schema.json', res.data);
				let string = printSchema(buildClientSchema(res.data));
				fse.writeFile('schema.graphql', string).then(resolve, reject);
			});
		});
*/
		this._express = express();
		this._express.use('/assets/thumbs/', express.static(env.config.paths.thumbs));
		this._express.use('/graphql', expressGraphql({
			schema,
			graphiql: true
		}));
		this._express.use(express.static('build'));
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
