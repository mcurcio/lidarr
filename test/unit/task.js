'use strict';

const tasks = require(libPath('task'));

describe('task', async () => {
	describe('base', async() => {
		const BaseTask = tasks.BaseTask;

		class SimpleTask extends BaseTask {
			_start() {
				setTimeout(this._onDidFinish.bind(this), 1);
			}
		};

		it('should provide an API', async() => {
			let task = new SimpleTask;
			let cb = jest.fn();
			task.onDidFinish(cb);
			await task.run();
			expect(cb.mock.calls.length).toBe(1);
		});
	});
});
