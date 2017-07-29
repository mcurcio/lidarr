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
		this._express.use('/assets/thumb/:uuid', (req, res, next) => {
			(async () => {
				const thumb = await this._env.db.Thumbnail.findOne({
					where: {
						uuid: req.params.uuid
					}
				});

				const file = path.join(this._env.config.paths.thumbs, thumb.path());

				await new Promise((resolve, reject) => {
					res.sendFile(file, (err) => {
						if (err) return reject(err);
						resolve();
					})
				});
			})()
			.catch((err) => this._env.logger.error({err}, "Server error"));
		});
		this._express.get('/assets/photo/:uuid', (req, res, next) => {
			(async () => {
				const photo = await this._env.db.Photo.findOne({
					where: {
						uuid: req.params.uuid
					}
				});

				const locations = await photo.getLocations();

				if (!locations.length) {
					throw new Error("No location available");
				}

				const file = path.join(this._env.config.paths.library, locations[0].path);

				await new Promise((resolve, reject) => {
					res.sendFile(file, (err) => {
						if (err) return reject(err);
						resolve();
					})
				});
			})()
			.catch((err) => this._env.logger.error({err}, "Server error"));
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
