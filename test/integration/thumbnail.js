'use strict';

const database = require(libPath('db'));
const tasks = require(libPath('task'));

const fse = require('fs-extra');
const fsp = require('fs-plus');
const path = require('path');

async function setupFixtures() {
	let tmpDir = await makeTempDirectory();
	await Promise.all([
		fse.mkdirs(path.join(tmpDir, 'library')),
		fse.mkdirs(path.join(tmpDir, 'imports')),
		fse.mkdirs(path.join(tmpDir, 'thumbs'))
	]);
	let db = await database(path.join(tmpDir, 'db.sqlite'));
	await Promise.all([
		fse.copy(FIXTURE_PATH, path.join(tmpDir, 'imports')),
		db.migrator.up()
	]);
	return [db, tmpDir];
}

describe('thumbnail', async () => {
	it('should work', async () => {
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

		let [db, tmpDir] = await setupFixtures();

		const IMP_DIR = path.join(tmpDir, 'imports');
		const LIB_DIR = path.join(tmpDir, 'library');
		const THUMB_DIR = path.join(tmpDir, 'thumbs');

		await (new tasks.SyncTask(IMP_DIR, db, {move:LIB_DIR})).run();

		expect(fsp.listSync(THUMB_DIR).length).toBe(0);

		await (new tasks.ThumbnailTask(LIB_DIR, THUMB_DIR, db)).run();

		let files = [];
		fsp.traverseTreeSync(THUMB_DIR, file => files.push(file), dir => true);

		expect(files.length).toBe(32);
	});
});
