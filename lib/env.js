'use strict';

const database = require('./db');

const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const fse = require('fs-extra');
const fsp = require('fs-plus');
const path = require('path');
/*
const DEFAULT_DATA_DIR_PATH = path.join(fsp.getAppDataDirectory(), 'lidarr');
const THUMBS_PATH = path.join(DATA_PATH, 'thumbs');
const CACHE_PATH = path.join(DATA_PATH, 'cache.json');
const DB_PATH = path.join(DATA_PATH, 'db.sqlite');

const DEFAULT_CONFIG = {
	configFile: DEFAULT_CONFIG_FILE_PATH,
	dataDirectory: DEFAULT_DATA_DIR_PATH,
	libraryDirectory: path.join("{data}", "library"),
	dbFile: path.join("{data}", "lidarr.db")
};
*/
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
				// do nothing
			} else if (file && (await fse.exists(file))) {
				config = await fse.readJson(file);
			} else {
				throw new Error("No configuration was provided to Environment");
			}

			const db = await database(config.db);
			const logger = bunyan.createLogger({
				name: 'lidarr',
				streams: [{
					level: 'info',
					type: 'raw',
					stream: bunyanDebugStream({
						basepath: path.resolve(path.join(__dirname, '..')),
						forceColor: true
					})
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
