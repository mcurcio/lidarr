'use strict';

const BaseTask = require('./base');

module.exports = class DelayTask extends BaseTask {
	constructor(msToDelay) {
		super();

		this._msDelay = msToDelay;
	}

	_start() {
		return new Promise((resolve) => {
			setTimeout(resolve, this._msDelay);
		});
	}
};
