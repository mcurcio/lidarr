'use strict';

const tasks = require(libPath('task'));

describe('task', async () => {
	describe('base', async() => {
		it('should provide an API', async() => {
			let task = new tasks.DelayTask(1);
			let cb = jest.fn();
			task.onDidFinish(cb);
			await task.run();
			expect(cb.mock.calls.length).toBe(1);
		});
	});
});
