'use strict';

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
