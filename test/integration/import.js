'use strict';

const fse = require('fs-extra');
const path = require('path');

const database = require(libPath('db'));
const importer = require(libPath('import'));

describe('import', () => {
	it('should exist', () => {
		assert.ok(importer);
	});

	describe('importer', () => {
		it('should work', () => {
			let db;
			return destroyTempDirectory()
			.then(() => Promise.all([
				makeTempDirectory('library'),
				makeTempDirectory('imports')
			])).then(() => fse.copy(FIXTURE_PATH, tmpPath('imports')))
			.then(() => database(tmpPath('db.sqlite')))
			.then((db_) => {
				db = db_;
				return importer(tmpPath('imports'), tmpPath('library'), db);
			}).then(() => {
				return db.Photo.findAll();
			}).then((photos) => {
				assert.lengthOf(photos, 12);
			});
		});
	});
});
