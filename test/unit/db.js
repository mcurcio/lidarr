'use strict';

const path = require('path');

const database = require(libPath('db'));

describe('database', () => {
	beforeEach(() => {
		return destroyTempDirectory()
		.then(() => makeTempDirectory());
	});

	it('requires migration', () => {
		return database(tmpPath('db.sqlite'))
			.then((db) => {
				return db.migrator.pending().then(pending => {
					return assert.isAtLeast(pending.length, 1);
				});
			});
	});

	it('migrations succeed', () => {
		return database(tmpPath('db.sqlite'))
			.then(db => {
				const p = db.migrator.up()
					.catch(e => {
						console.error('up', e);
					})
				return assert.isFulfilled(p);
			});
	});

	it('works', () => {
		return database(tmpPath('db.sqlite'))
			.then(db => {
				return db.migrator.up().then(migrations => db);
			}).then((db) => {
			let camera = new db.Camera;
			camera.name = 'Camera';
			return assert.isFulfilled(camera.save());
		});
	});
});
