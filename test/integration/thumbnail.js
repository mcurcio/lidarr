'use strict';

const tasks = require(libPath('task'));

const fse = require('fs-extra');
const fsp = require('fs-plus');
const path = require('path');

describe('thumbnail', async () => {
	it('should work', async () => {
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

		let tenv = await TestEnvironment.create();

		await (new tasks.SyncTask(tenv.config.paths.imports, tenv.env, {move:tenv.config.paths.library})).run();

		expect(fsp.listSync(tenv.config.paths.thumbs).length).toBe(0);

		await (new tasks.ThumbnailTask(tenv.env)).run();
		await (new tasks.ThumbnailTask(tenv.env)).run();
		await (new tasks.ThumbnailTask(tenv.env)).run();

		let files = [];
		fsp.traverseTreeSync(tenv.config.paths.thumbs, file => files.push(file), dir => true);

		let photoCount = await tenv.db.Photo.count();
		expect(files.length).toBe(photoCount * tenv.db.Thumbnail.sizes.length);

		await tenv.destroy();
	});
});
