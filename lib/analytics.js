'use strict';

const ua = require('universal-analytics');

const APP = "";

module.exports =
class Analytics {
	constructor(uuid) {
		this._ua = ua(APP, uuid, {https: true});
		this._enabled = false;
	}

	/**
	 * Require an explicit enable so that analytics are not
	 * incidentally sent in a test environment
	 */
	enable() {
		this._enabled = true;
	}

	disable() {
		this._enabled = false;
	}

	page(page) {
		return new Promise((resolve, reject) => {
			this._ua.pageview(page, (err) => {
				if (err) return reject(err);
				resolve();
			});
		});
	}
};
