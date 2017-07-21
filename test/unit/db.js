'use strict';

const path = require('path');

const database = require(libPath('db'));

describe('database', () => {
	let tmpDir;

	beforeEach(async () => {
		tmpDir = await makeTempDirectory();
	});

	it('requires migration', async () => {
		let db = await database(path.join(tmpDir, 'db.sqlite'));
		let pending = await db.migrator.pending();
		assert.isAtLeast(pending.length, 1);
	});

	it('migrations succeed', async () => {
		let db = await database(path.join(tmpDir, 'db.sqlite'));
		await db.migrator.up();
	});

	it('works', async () => {
		let db = await database(path.join(tmpDir, 'db.sqlite'));
		await db.migrator.up();

		let camera = new db.Camera;
		camera.name = 'Camera';
		await assert.isFulfilled(camera.save());
	});
});
