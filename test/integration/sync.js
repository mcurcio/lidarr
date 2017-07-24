'use strict';

const fse = require('fs-extra');
const path = require('path');

const database = require(libPath('db'));
const sync = require(libPath('sync'));
const {SyncTask} = require(libPath('task'));

async function setupFixtures() {
	let tmpDir = await makeTempDirectory();
	await Promise.all([
		fse.mkdirs(path.join(tmpDir, 'library')),
		fse.mkdirs(path.join(tmpDir, 'imports'))
	]);
	let db = await database(path.join(tmpDir, 'db.sqlite'));
	await Promise.all([
		fse.copy(FIXTURE_PATH, path.join(tmpDir, 'imports')),
		db.migrator.up()
	]);
	return [db, tmpDir];
}

describe('import', () => {
	it('should exist', () => {
		assert.ok(sync);
	});

	describe('importer', () => {
		it('should work', async () => {
			let [db, tmpDir] = await setupFixtures();
			const IMP_DIR = path.join(tmpDir, 'imports');
			const LIB_DIR = path.join(tmpDir, 'library');

			await (new SyncTask(IMP_DIR, db, {move:LIB_DIR})).run();

			let [photoCount, locationCount, relativeCount, momentCount] = await Promise.all([
				db.Photo.count(),
				db.Location.count(),
				db.Relative.count(),
				db.Moment.count()
			]);
			expect(photoCount).toBe(16);
			expect(locationCount).toBe(17);
			expect(relativeCount).toBe(1);
			expect(momentCount).toBe(10);

			let [locations, relatives] = await Promise.all([
				db.Location.all(),
				db.Relative.all()
			]);
			let promises = locations.map(async (location) => {
				let p = path.join(LIB_DIR, location.path);
				expect(await fse.pathExists(p)).toBe(true);
			});
			promises.concat(relatives.map(async (relative) => {
				let p = path.join(LIB_DIR, relative.path);
				expect(await fse.pathExists(p)).toBe(true);
			}));
			await Promise.all(promises);
		});

		it('should match existing files', async () => {
			let [db, tmpDir] = await setupFixtures();

			await (new SyncTask(path.join(tmpDir, 'imports'), db)).run();
			await (new SyncTask(path.join(tmpDir, 'imports'), db)).run();

			let [photoCount, locationCount, relativeCount] = await Promise.all([
				db.Photo.count(),
				db.Location.count(),
				db.Relative.count()
			]);

			assert.equal(photoCount, 16);
			assert.equal(locationCount, 17);
			assert.equal(relativeCount, 1);
		});

		it('should support cancellation', async () => {
			let [db, tmpDir] = await setupFixtures();
			let task = new SyncTask(path.join(tmpDir, 'imports'), db);
			task.start();
			task.cancel();
			await task.promise();
			let photoCount = await db.Photo.count();
			assert.equal(photoCount, 0);
		});
	});
});
