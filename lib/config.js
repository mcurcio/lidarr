'use strict';

const fse = require('fse');
const fsp = require('fsp');

const DEFAULTS = {
	"paths": {
		"data": // FIXME
	}
};

module.exports =
class Config {
	static fromFile(file) {
		return (async () => {
			let contents = await fse.readJson(file);
			return Config.fromObject(contents);
		})();
	}

	static fromObject(object) {
		return (async () => {
			return Object.assign({
				// FIXME
			}, object);
		});
	}
};
