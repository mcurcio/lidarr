'use strict';

const fs = require('fs');
const path = require('path');

const chai = require('chai');
const rimraf = require('rimraf');

// set up chai/assert
chai.use(require('chai-as-promised'));
global.assert = chai.assert;

// add utility path functions
const FIXTURE_PATH = "fixtures";

global.fixture = file => {
	return path.join(__dirname, FIXTURE_PATH, file);
};

global.lib = file => {
	return path.join(__dirname, '..', 'lib', file);
};

global.makeTempDirectory = () => {
	const tmpDirectory = path.join(__dirname, 'tmp');

	return new Promise((resolve, reject) => {
		rimraf(tmpDirectory, (err) => {
			if (err) return reject(err);

			fs.mkdir(tmpDirectory, (err) => {
				if (err) return reject();

				resolve(tmpDirectory);
			});
		});
	});
};
