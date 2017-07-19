'use strict';

const getBabelRelayPlugin = require('babel-relay-plugin');

let schema;
(async () => {
	schema = await require('./bin/schema')();

	module.exports = getBabelRelayPlugin(schema);
})();

