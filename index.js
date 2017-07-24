'use strict';

const path = require('path');

['db', 'image', 'sync', 'task'].forEach(key => {
	exports[key] = require(path.join(__dirname, 'lib', key));
});

exports.Server = require(path.join(__dirname, 'lib', 'server'));
