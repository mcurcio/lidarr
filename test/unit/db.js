'use strict';

const db = require('../../lib/db.js');

describe('database', () => {
	it('works', () => {
		return require('../../lib/db.js')('./db.sqlite').then((db) =>{
			let camera = new db.Camera;
			camera.name = 'Camera';
			return assert.isFulfilled(camera.save());
		});
	});
});
