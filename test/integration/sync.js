'use strict';

const fse = require('fs-extra');
const path = require('path');

const database = require(libPath('db'));
const sync = require(libPath('sync'));

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
			const LIB_DIR = path.join(tmpDir, 'library');

			await sync.dir(path.join(tmpDir, 'imports'), db, {move:LIB_DIR}).promise;

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

			await sync.dir(path.join(tmpDir, 'imports'), db).promise;
			await sync.dir(path.join(tmpDir, 'imports'), db).promise;

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
			let importer = sync.dir(path.join(tmpDir, 'imports'), db);
			importer.cancel();
			await importer.promise;
			let photoCount = await db.Photo.count();
			assert.equal(photoCount, 0);
		});
	});
});
