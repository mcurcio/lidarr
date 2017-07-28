'use strict';

const fse = require('fs-extra');
const path = require('path');

const {SyncTask} = require(libPath('task'));

describe('sync', () => {
	describe('task', () => {
		const tenvs = [];

		beforeEach(async () => {
			this.tenv = await TestEnvironment.create();
		});

		afterEach(async () => {
			tenvs.push(this.tenv);
		});

		after(async () => {
			return tenvs.map(t => t.destroy());
		});

		it('should work', async () => {
			const tenv = this.tenv;

			await (new SyncTask(tenv.config.paths.imports, tenv.env, {move: tenv.config.paths.library})).run();

			let [photoCount, locationCount, relativeCount, momentCount] = await Promise.all([
				tenv.db.Photo.count(),
				tenv.db.Location.count(),
				tenv.db.Relative.count(),
				tenv.db.Moment.count()
			]);
			assert.strictEqual(photoCount, 16);
			assert.strictEqual(locationCount, 17);
			assert.strictEqual(relativeCount, 1);
			assert.strictEqual(momentCount, 10);

			let [locations, relatives] = await Promise.all([
				tenv.db.Location.all(),
				tenv.db.Relative.all()
			]);
			let promises = locations.map(async (location) => {
				let p = path.join(tenv.config.paths.library, location.path);
				assert(await fse.pathExists(p));
			});
			promises.concat(relatives.map(async (relative) => {
				let p = path.join(tenv.config.paths.library, relative.path);
				assert(await fse.pathExists(p));
			}));
			await Promise.all(promises);
		});

		it('should match existing files', async () => {
			const tenv = this.tenv;

			await (new SyncTask(tenv.config.paths.imports, tenv.env)).run();
			await (new SyncTask(tenv.config.paths.imports, tenv.env)).run();

			let [photoCount, locationCount, relativeCount] = await Promise.all([
				tenv.db.Photo.count(),
				tenv.db.Location.count(),
				tenv.db.Relative.count()
			]);

			assert.strictEqual(photoCount, 16);
			assert.strictEqual(locationCount, 17);
			assert.strictEqual(relativeCount, 1);
		});

		it('should support cancellation', async () => {
			const tenv = this.tenv;

			let task = new SyncTask(tenv.config.paths.imports, tenv.env);
			await assert.isRejected(task.promise());
			task.start();
			task.cancel();
			await task.promise();
			let photoCount = await tenv.db.Photo.count();
			assert.strictEqual(photoCount, 0);
		});
	});
});
