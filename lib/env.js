'use strict';

const db = require('./db');

const fse = require('fs-extra');
const fsp = require('fs-plus');
const path = require('path');

const DATA_PATH = path.join(fsp.getAppDataDirectory(), 'lidarr');
const THUMBS_PATH = path.join(DATA_PATH, 'thumbs');
const CACHE_PATH = path.join(DATA_PATH, 'cache.json');
const DB_PATH = path.join(DATA_PATH, 'db.sqlite');

class Environment {
	static load(configFile, logger) {
		return (async () => {
			const [config, cache, db] = await Promise.all([
				fse.readJson(configFile),
				fse.readJson(CACHE_PATH),
				db(DB_PATH)
			]);

			const env = new Environment;
			env.config = config;
			env.cache = cache;
			env.db = db;
			env.logger = logger;
		})();
	}
};
