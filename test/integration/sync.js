'use strict';

const fse = require('fs-extra');
const path = require('path');

const database = require(libPath('db'));
const sync = require(libPath('sync'));

function setupFixtures() {
	let db;
	return destroyTempDirectory()
		.then(() => Promise.all([
			makeTempDirectory('library'),
			makeTempDirectory('imports')
		]))
		.then(() => fse.copy(FIXTURE_PATH, tmpPath('imports')))
		.then(() => database(tmpPath('db.sqlite')))
		.then(db_ => {
			db = db_;
			return db.migrator.up();
		})
		.then(() => db);
}

describe('import', () => {
	it('should exist', () => {
		assert.ok(sync);
	});

	describe('importer', () => {
		let db;
		it('should work', () => {
			return setupFixtures()
			.then((db_) => {
				db = db_;
				return sync.dir(tmpPath('imports'), tmpPath('library'), db).promise;
			}).then(() => {
				return Promise.all([
					db.Photo.count(),
					db.Location.count()
				]);
			}).then(([photoCount, locationCount]) => {
				assert.equal(photoCount, 12);
				assert.equal(locationCount, 12);
			});
		});

		it('should support cancellation', () => {
			let db;
			return setupFixtures()
				.then((db_) => {
					db = db_;
					let importer = sync.dir(tmpPath('imports'), tmpPath('library'), db);
					importer.cancel();
					return importer.promise;
				}).then(() => {
					assert.becomes(db.Photo.count(), 0);
				});
		});
	});
});
