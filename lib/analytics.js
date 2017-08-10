'use strict';

const ua = require('universal-analytics');

const APP = "UA-104379137-1";

module.exports =
class Analytics {
	constructor(uuid) {
		if (!uuid) {
			throw new Error("A UUID must be provided");
		}

		this._ua = ua(APP, uuid, {https: true});
		this._started = false;
		this._enabled = true;
	}

	/**
	 * Require an explicit start so that analytics are not
	 * incidentally sent in a test environment
	 */
	start() {
		this._started = true;
	}

	enabled() {
		return this._enabled;
	}

	enable() {
		this._enabled = true;
	}

	disable() {
		this._enabled = false;
	}

	page(page) {
		if (this._shouldSend()) {
			return new Promise((resolve, reject) => {
				this._ua.pageview(page, (err) => {
					if (err) return reject(err);
					resolve();
				});
			});
		}
	}

	event(category, action) {
		if (this._shouldSend()) {
			return new Promise((resolve, reject) => {
				this._ua.event(category, action, (err) => {
					if (err) return reject(err);
					resolve();
				});
			});
		}
	}

	_shouldSend() {
		return this._started && this._enabled;
	}
};
