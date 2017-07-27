'use strict';

const {Emitter} = require('event-kit');

module.exports.BaseTask = require('./tasks/base');
module.exports.DelayTask = require('./tasks/delay');
module.exports.SyncTask = require('./tasks/sync');
module.exports.ThumbnailTask = require('./tasks/thumbnail');

const DID_FINISH = 'on-did-finish';
const DID_LOOP = 'on-did-loop';

module.exports.TaskRunner = class TaskRunner {
	constructor() {
		this._tasks = [];
		this._active = null;
		this._repeat = false;

		this._emitter = new Emitter;
	}

	addTask(task) {
		if (this._tasks.includes(task)) {
			throw new Error("Task is already in runner");
		}

		this._tasks.push(task);
	}

	clearTasks() {
		this._tasks = [];
	}

	onDidFinish(cb) {
		return this._emitter(DID_FINISH, cb);
	}

	onDidLoop(cb) {
		return this._emitter(DID_LOOP, cb);
	}

	// run all tasks
	start() {
		if (this._active) {
			throw new Error("A task is already running");
		}

		let run = () => {
			let next = this._next(this._active);
			let onDidFinishHandle;
			if (next) {
				onDidFinishHandle = next.onDidFinish(() => {
					// pop next task and repeat
					onDidFinishHandle.dispose();
					if (!run()) {
						this._emitter.emit(DID_FINISH);
					}
				});
				this._active = next;
				next.start();
				return true;
			} else {
				return false;
			}
		};
		run();
	}

	// run next task
	_next(active) {
		if (active) {
			let index = this._tasks.indexOf(active);
			if (index < 0) {
				// task was removed from list, so start at 0
				return this._tasks[0];
			} else {
				return this._tasks[index+1];
			}
		} else {
			return this._tasks[0];
		}
	}
};
