'use strict';

const {Emitter} = require('event-kit');

const DID_START = 'on-did-start';
const DID_FINISH = 'on-did-finish';

module.exports = class BaseTask {
	constructor() {
		this._emitter = new Emitter;
		this._canceled = false;
		this._promise;
		this._resolve = null;
		this._done = true;
		this.onDidFinish(() => {
			this._done = true;
			if (this._resolve) {
				this._resolve();
			}
		});
	}

	start() {
		if (!this._done) {
			throw new Error("Task is already running");
		}

		this._canceled = false;
		this._done = false;

		this._promise = new Promise((resolve) => this._resolve = resolve);

		this._start();
	}

	cancel() {
		this._canceled = true;
		this._cancel();
	}

	_cancel() {}

	promise() {
		if (this._promise) {
			return this._promise;
		} else {
			return Promise.reject(new Error("Task is not running"));
		}
	}

	run() {
		this.start();
		return this.promise();
	}

	onDidStart(cb) {
		return this._emitter.on(DID_START, cb);
	}

	_onDidStart() {
		this._emitter.emit(DID_START);
	}

	onDidFinish(cb) {
		return this._emitter.on(DID_FINISH, cb);
	}

	_onDidFinish() {
		this._emitter.emit(DID_FINISH);
	}
};
