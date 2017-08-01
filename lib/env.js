'use strict';

const Config = require('./config');
const database = require('./db');

const bunyan = require('bunyan');
const fse = require('fs-extra');
const fsp = require('fs-plus');
const path = require('path');
const util = require('util');

module.exports =
class Environment {
	/**
	 * Given a configuration or config file path, parse the configuration
	 * and generate the environment: db, logger, system directories, etc.
	 * A config object takes precedence over a file path. If config object
	 * is not provided and config file is missing or malformed, an error
	 * is returned.
	 */
	static load({file, config}) {
		return (async () => {
			if (config && util.isObject(config)) {
				config = await Config.fromObject(config);
			} else if (file && (await fse.exists(file))) {
				config = await Config.fromFile(file);
			} else {
				throw new Error("No configuration was provided to Environment");
			}

			await Promise.all(Object.values(config.paths).map(path => fse.ensureDir(path)));

			// Logger
			const serializers = [];

			const streams = [{
				level: 'trace',
				type: 'rotating-file',
				path: path.join(config.paths.logs, 'lidarr.log'),
				period: '1d',
				count: 14
			}];
			if (config.get("console")) {
				const bunyanDebugStream = require('bunyan-debug-stream');
				streams.push({
					level: 'debug',
					type: 'raw',
					stream: bunyanDebugStream({
						basepath: path.resolve(path.join(__dirname, '..')),
						forceColor: true
					})

				});
				serializers.push(bunyanDebugStream.serializers);
			}

			const logger = bunyan.createLogger({
				name: 'lidarr',
				streams,
				serializers: bunyan.stdSerializers
			});

			// Database

			const db = await database(path.join(config.paths.data, 'lidarr.db'), {
				config,
				logger,
				timezone: config.get('timezone'),
			});

			Object.keys(db.sequelize.models).forEach(key => {
				serializers.push({
					[key](obj) {
						if (!obj) {
							return obj;
						}
						return {
							[key]: obj.get({plain:true})
						};
					},
					[key + 's'] (array) {
						if (!array) {
							return array;
						}

						if (!Array.isArray(array)) {
							return array;
						}

						return {
							[key + 's']: array.map(v => v.get({plain:true}))
						};
					}
				});
			});

			serializers.forEach(s => logger.addSerializers(s));

			return new Environment(config, db, logger);
		})();
	}

	constructor(config, db, logger) {
		this.config = config;
		this.db = db;
		this.logger = logger;
	}
};
