'use strict';

const Environment = require('../lib/env');

const fse = require('fs-extra');
const path = require('path');

const chai = require('chai');
const rimraf = require('rimraf');
const tmp = require('tmp');

global.LIB_PATH = path.join(__dirname, '..', 'lib');
global.FIXTURE_PATH = path.join(__dirname, 'fixtures');

// set up chai/assert
chai.use(require('chai-as-promised'));
global.assert = chai.assert;

// utility path functions
function pathConcatFunctionFactory(base) {
	return (...files) => {
		return path.join.apply(null, [base].concat(files));
	}
}

global.fixturePath = pathConcatFunctionFactory(FIXTURE_PATH);
global.libPath = pathConcatFunctionFactory(LIB_PATH);

global.makeTempDirectory = () => {
	return new Promise((resolve, reject) => {
		tmp.dir({
			unsafeCleanup: true,
			prefix: 'lidarr_test_'
		}, (err, dir) => {
			if (err) return reject(err);
			resolve(dir);
		});
	});
};

global.TestEnvironment =
class TestEnvironment {
	static create(config={}) {
		return (async () => {
			let tmpDir = null;

			if (!config.hasOwnProperty('data')) {
				tmpDir = await makeTempDirectory();
				config.data = tmpDir;
			}

			let env = await Environment.load({config});

			env.config.paths.imports = path.join(env.config.paths.data, 'imports');

			await Promise.all([
				env.db.migrator.up(),
				fse.mkdirs(env.config.paths.imports)
			]);
			await fse.copy(FIXTURE_PATH, env.config.paths.imports);

			return new TestEnvironment(env, tmpDir);
		})();
	}

	constructor(env, tmpDir=null) {
		this.env = env;
		this.tmp = tmpDir;

		// convenience
		this.config = env.config;
		this.db = env.db;
		this.logger = env.logger;
	}

	destroy() {
		if (this.tmp) {
			return fse.remove(this.tmp);
		}
	}
};
