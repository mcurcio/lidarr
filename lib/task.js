'use strict';

module.exports.SyncTask = require('./tasks/Sync');

module.exports.TaskRunner = class TaskRunner {
	constructor() {
		this._tasks = [];
		this._index = 0;
		this._repeat = false;
	}

	run() {
		// run all tasks
	}

	_next() {
		// run next task, and wait for finish
	}
};
