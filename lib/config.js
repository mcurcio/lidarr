'use strict';

const convict = require('convict');
const fsp = require('fs-plus');
const path = require('path');

const SCHEMA = {
	data: {
		format: String,
		default: path.join(fsp.getAppDataDirectory(), 'lidarr')
	},
	library: {
		format: String,
		default: path.join("{data}", "library")
	},
	console: {
		format: Boolean,
		default: true
	}
};

function normalize(config) {
	config.validate({allowed:'strict'});

	let data = config.get("data");
	let lib = config.get("library");

	data = fsp.absolute(data);

	lib = lib.replace(/{data}/g, data);
	lib = fsp.absolute(lib);

	config.paths = {
		data,
		library: lib,
		logs: path.join(data, "logs"),
		thumbs: path.join(data, "thumbs")
	};
}

module.exports =
class Config {
	static fromFile(file) {
		return (async () => {
			const config = convict(SCHEMA);
			config.loadFile(file);
			normalize(config);
			return config;
		})();
	}

	static fromObject(object) {
		return (async () => {
			const config = convict(SCHEMA);
			config.load(object);
			normalize(config);
			return config;
		})();
	}
};
