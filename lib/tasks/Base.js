'use strict';

const {Emitter} = require('event-kit');

const DID_START = 'on-did-start';
const DID_FINISH = 'on-did-finish';

module.exports = class BaseTask {
	constructor() {
		this._emitter = new Emitter;
		this._canceled = false;
	}

	run() {
		this._canceled = false;
		this._run();
	}

	cancel() {
		this._canceled = true;
	}

	onDidStart(cb) {
		this._emitter.on(DID_START, cb);
	}

	_onDidStart() {
		this._emitter.emit(DID_START);
	}

	onDidFinish(cb) {
		this._emitter.on(DID_FINISH, cb);
	}

	_onDidFinish() {
		this._emitter.emit(DID_FINISH);
	}
};
