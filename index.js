'use strict';

const path = require('path');

['db', 'image', 'task'].forEach(key => {
	exports[key] = require(path.join(__dirname, 'lib', key));
});

exports.Environment = require(path.join(__dirname, 'lib', 'env'));
exports.Server = require(path.join(__dirname, 'lib', 'server'));
