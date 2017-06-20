'use strict';

const path = require('path');

const database = require(libPath('db'));

describe('database', () => {
	beforeEach(() => {
		return destroyTempDirectory()
		.then(() => makeTempDirectory());
	});

	it('works', () => {
		return database(tmpPath('db.sqlite')).then((db) => {
			let camera = new db.Camera;
			camera.name = 'Camera';
			return assert.isFulfilled(camera.save());
		});
	});
});
