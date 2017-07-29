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
	constructor(env) {
		this._env = env;

		const schema = require('./graphql')(this._env);

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
		this._express.use('/assets/thumb/', express.static(this._env.config.paths.thumbs));
		this._express.get('/assets/photo/:uuid', (req, res, next) => {
			this._env.logger.info({req, uuid: req.params.uuid}, 'Photo request');
			this._env.db.Photo.findOne({
				where: {
					uuid: req.params.uuid
				}
			}).then(async (photo) => {
				const locations = await photo.getLocations();
				if (locations.length) {
					const p = path.join(this._env.config.paths.library, locations[0].path);
					this._env.logger.info('Sending photo ' + p);
					res.sendFile(p, (err) => {
						if (err) {
							this._env.logger.error({err}, "Server error");
							next(err);
						}

						return next();
					});
				} else {
					res.sendStatus(404);
					next();
				}
			}).catch((err) => {
				this._env.logger.error({err}, "Server error");
				next(err);
			});
		});
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
