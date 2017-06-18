'use strict';

const path = require('path');

const database = require(lib('db'));

let TMP;

describe('database', () => {
	beforeEach(() => {
		return makeTempDirectory().then(dir => { TMP = dir; });
	});

	it('works', () => {
		return database(path.join(TMP, 'db.sqlite')).then((db) =>{
			let camera = new db.Camera;
			camera.name = 'Camera';
			return assert.isFulfilled(camera.save());
		});
	});
});
