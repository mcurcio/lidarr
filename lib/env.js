'use strict';

const Config = require('./config');
const database = require('./db');

const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const fse = require('fs-extra');
const fsp = require('fs-plus');
const path = require('path');

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
			if (config && Object.isObject(config)) {
				config = await Config.fromObject(config);
			} else if (file && (await fse.exists(file))) {
				config = await Config.fromFile(file);
			} else {
				throw new Error("No configuration was provided to Environment");
			}

			await Promise.all(Object.values(config.paths).map(path => fse.ensureDir(path)));

			const db = await database(path.join(config.paths.data, 'lidarr.db'));
			const logger = bunyan.createLogger({
				name: 'lidarr',
				streams: [{
					level: 'debug',
					type: 'raw',
					stream: bunyanDebugStream({
						basepath: path.resolve(path.join(__dirname, '..')),
						forceColor: true
					})
				}, {
					level: 'trace',
					type: 'rotating-file',
					path: path.join(config.paths.logs, 'lidarr.log'),
					period: '1d',
					count: 14
				}],
				serializers: bunyanDebugStream.serializers
			});

			return new Environment(config, db, logger);
		})();
	}

	constructor(config, db, logger) {
		this.config = config;
		this.db = db;
		this.logger = logger;
	}
};
