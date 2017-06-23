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
		let db;
		it('should work', () => {
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
				return importer(tmpPath('imports'), tmpPath('library', 'copy'), db);
			}).then(() => {
				return Promise.all([
					db.Photo.count(),
					db.Location.count()
				]);
			}).then(([photoCount, locationCount]) => {
				assert.equal(photoCount, 12);
				assert.equal(locationCount, 24);
			}).catch((e) => {
				console.error('error', e);
				throw e;
			});
		});
/*
		it('print', () => {
			return db.Photo.findAll({
				include: [{
					model: db.Location
				}]
			}).then((photos) => {
				for (let p of photos) {
					console.log(p.get({
      						plain: true
    					}));
				}
			});
	
		});
*/
	});
});
