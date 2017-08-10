'use strict';

const fse = require('fs-extra');
const path = require('path');

const {SyncTask} = require(libPath('task'));

describe('sync', () => {
	describe('task', () => {
		const tenvs = [];

		beforeEach(async function () {
			this.tenv = await TestEnvironment.create({console: true});//, data:"./test_env"});
		});

		afterEach(async function () {
			tenvs.push(this.tenv);
		});

		after(async function () {
			return tenvs.map(t => t.destroy());
		});

		it.only('should work', async function () {
			this.timeout(10000);

			const tenv = this.tenv;

			await (new SyncTask(tenv.config.paths.imports, tenv.env, {move: tenv.config.paths.library})).run();

			let [assetCount, instanceCount, momentCount] = await Promise.all([
				tenv.db.Asset.count(),
				tenv.db.Instance.count(),
				tenv.db.Moment.count()
			]);
			tenv.logger.info({assets: await tenv.db.Asset.all()}, "Assets");
			assert.strictEqual(assetCount, 17);
			assert.strictEqual(instanceCount, 18);
			assert.strictEqual(momentCount, 10);

			let instances = await tenv.db.Instance.all();
			await instances.map(async (i) => {
				let p = path.join(tenv.config.paths.library, i.path);
				let exists = await fse.pathExists(p);
				assert(exists);
			});
		});

		it('should match existing files', async function () {
			this.timeout(20000);

			const tenv = this.tenv;

			await (new SyncTask(tenv.config.paths.imports, tenv.env)).run();
			await (new SyncTask(tenv.config.paths.imports, tenv.env)).run();

			let [assetCount, instanceCount] = await Promise.all([
				tenv.db.Asset.count(),
				tenv.db.Instance.count(),
			]);

			assert.strictEqual(assetCount, 17);
			assert.strictEqual(instanceCount, 18);
		});

		it('should support cancellation', async function () {
			this.timeout(10000);

			const tenv = this.tenv;

			let task = new SyncTask(tenv.config.paths.imports, tenv.env);
			await assert.isRejected(task.promise());
			task.start();
			task.cancel();
			await task.promise();
			let assetCount = await tenv.db.Asset.count();
			assert.strictEqual(assetCount, 0);
		});
	});
});
