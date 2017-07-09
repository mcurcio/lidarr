'use strict';

const fse = require('fs-extra');
const path = require('path');

const database = require(libPath('db'));
const sync = require(libPath('sync'));

async function setupFixtures() {
	await  destroyTempDirectory();
	await Promise.all([
		makeTempDirectory('library'),
		makeTempDirectory('imports')
	]);
	let db = await database(tmpPath('db.sqlite'));
	await Promise.all([
		fse.copy(FIXTURE_PATH, tmpPath('imports')),
		db.migrator.up()
	]);
	return db;
}

describe('import', () => {
	it('should exist', () => {
		assert.ok(sync);
	});

	describe('importer', () => {
		it('should work', async () => {
			let db = await setupFixtures();
			const LIB_DIR = tmpPath('library');
			await sync.dir(tmpPath('imports'), LIB_DIR, db, {move:true}).promise;
			let [photoCount, locationCount, relativeCount, momentCount] = await Promise.all([
				db.Photo.count(),
				db.Location.count(),
				db.Relative.count(),
				db.Moment.count()
			]);
			assert.equal(photoCount, 16);
			assert.equal(locationCount, 16);
			assert.equal(relativeCount, 1);
			assert.equal(momentCount, 10);

			let [locations, relatives] = await Promise.all([
				db.Location.all(),
				db.Relative.all()
			]);
			let promises = locations.map(location => {
				let p = path.join(LIB_DIR, location.path);
				return assert.becomes(fse.pathExists(p), true);
			});
			promises.concat(relatives.map(relative => {
				let p = path.join(LIB_DIR, relative.path);
				return assert.becomes(fse.pathExists(p), true);
			}));
			await Promise.all(promises);
		});

		it('should support cancellation', async () => {
			let db = await setupFixtures();
			let importer = sync.dir(tmpPath('imports'), tmpPath('library'), db, { move: true });
			importer.cancel();
			await importer.promise;
			let photoCount = await db.Photo.count();
			assert.equal(photoCount, 0);
		});
	});
});
