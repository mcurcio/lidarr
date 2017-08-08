'use strict';

const tasks = require(libPath('task'));

const fse = require('fs-extra');
const fsp = require('fs-plus');
const path = require('path');

describe('thumbnail', async () => {
	beforeEach(async function() {
		this.tenv = await TestEnvironment.create();//{console:true, data:"./testenv"});
	});

	afterEach(async function() {
		await this.tenv.destroy()
	});

	it('should work', async function() {
		this.timeout(20000);

		const tenv = this.tenv;

		await (new tasks.SyncTask(tenv.config.paths.imports, tenv.env, {move:tenv.config.paths.library})).run();

		assert.lengthOf(fsp.listSync(tenv.config.paths.thumbs), 0);

		await (new tasks.ThumbnailTask(tenv.env)).run();

		let files = [];
		fsp.traverseTreeSync(tenv.config.paths.thumbs, file => files.push(file), dir => true);

		let assetCount = await tenv.db.Asset.count();
		assert.strictEqual(files.length, 32/*assetCount * tenv.db.Thumbnail.sizes.length*/);
	});
});
