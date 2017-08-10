'use strict';

const convict = require('convict');
const fse = require('fs-extra');
const path = require('path');
const uuid = require('uuid');

const SCHEMA = {
	uuid: {
		format: String,
		default: uuid.v4()
	},
	analytics: {
		format: String,
		default: uuid.v4()
	}
};

function normalize(settings) {
	settings.validate({allowed:'strict'});
}

module.exports =
class Settings {
	static fromFile(file) {
		return (async () => {
			let obj = {};
			try {
				obj = await fse.readJson(file);
			} catch (e) {}
			const settings = convict(SCHEMA);
			settings.load(obj);
			normalize(settings);
			return settings;
		})();
	}

	static toFile(settings, file) {
		return fse.outputFile(file, settings.toString());
	}
};
