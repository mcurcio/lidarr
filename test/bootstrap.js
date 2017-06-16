'use strict';

// set up chai/assert
const chai = require('chai');
chai.use(require('chai-as-promised'));
global.assert = chai.assert;

// add utility path functions
const path = require('path');

const FIXTURE_PATH = "fixtures";

global.fixture = file => {
	return path.join(__dirname, FIXTURE_PATH, file);
};
