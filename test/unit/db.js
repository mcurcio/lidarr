'use strict';

const path = require('path');

const database = require(libPath('db'));
console.log('required database');

describe('database', () => {
	beforeEach(async () => {
		console.log('beforeEach');
		await destroyTempDirectory();
		await makeTempDirectory();
	});

	it('requires migration', async () => {
		console.log('create database', database);
		let db = await database(tmpPath('db.sqlite'));
		let pending = await db.migrator.pending();
		assert.isAtLeast(pending.length, 1);
	});

	it('migrations succeed', () => {
		let db = await database(tmpPath('db.sqlite'));
		await db.migrator.up();
	});

	it('works', () => {
		let db = await database(tmpPath('db.sqlite'));
		await db.migrator.up();

		let camera = new db.Camera;
		camera.name = 'Camera';
		await assert.isFulfilled(camera.save());
	});
});
