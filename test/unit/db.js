'use strict';

const fsp = require('fs-plus');
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

		let files = [];
		fsp.traverseTreeSync(libPath('models', 'migrations'), file => files.push(file), dir => true);

		assert.isAtLeast(pending.length, files.length);
	});

	it('migrations succeed', async () => {
		let db = await database(path.join(tmpDir, 'db.sqlite'));
		await db.migrator.up();
		assert.lengthOf(await db.migrator.pending(), 0);
	});

	it('works', async () => {
		let db = await database(path.join(tmpDir, 'db.sqlite'));
		await db.migrator.up();

		let camera = new db.Camera;
		camera.name = 'Camera';
		await assert.isFulfilled(camera.save());
	});

	describe('thumbnail', async () => {
		it('should have default UUID', async () => {
			let db = await database(path.join(tmpDir, 'db.sqlite'));
			await db.migrator.up();

			let thumb = new db.Thumbnail;
			assert(thumb.uuid);
		});
	});
});
