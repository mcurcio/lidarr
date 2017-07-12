'use strict';

const express = require('express');
const expressGraphql = require('express-graphql');
const schema = require('./graphql');

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
