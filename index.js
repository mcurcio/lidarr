'use strict';

const path = require('path');

['db', 'image', 'sync'].forEach(key => {
	exports[key] = require(path.join(__dirname, 'lib', key));
});
