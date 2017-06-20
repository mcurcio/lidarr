'use strict';

const fse = require('fs-extra');
const path = require('path');

const chai = require('chai');
const rimraf = require('rimraf');

global.LIB_PATH = path.join(__dirname, '..', 'lib');
global.FIXTURE_PATH = path.join(__dirname, 'fixtures');
global.TMP_PATH = path.join(__dirname, 'tmp');

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
global.tmpPath = pathConcatFunctionFactory(TMP_PATH);

global.destroyTempDirectory = () => {
	return fse.remove(TMP_PATH);
};

global.makeTempDirectory = (...files) => {
	return fse.mkdirs(tmpPath(...files));
};
