'use strict';

const fse = require('fs-extra');
const path = require('path');

const Environment = require(libPath('env'));
const {SyncTask} = require(libPath('task'));

async function setupFixtures() {
	let tmpDir = await makeTempDirectory();
	let env = await Environment.load({ config: {data: tmpDir} });
	env.config.paths.imports = path.join(env.config.paths.data, 'imports');
	await env.db.migrator.up();
	await fse.mkdirs(env.config.paths.imports);
	await fse.copy(FIXTURE_PATH, env.config.paths.imports);
	return env;
}

describe.skip('import', () => {
	describe('importer', () => {
		it('should work', async () => {
			const env = await setupFixtures();

			await (new SyncTask(env.config.paths.imports, env.db, {move: env.config.paths.library})).run();

			let [photoCount, locationCount, relativeCount, momentCount] = await Promise.all([
				env.db.Photo.count(),
				env.db.Location.count(),
				env.db.Relative.count(),
				env.db.Moment.count()
			]);
			expect(photoCount).toBe(16);
			expect(locationCount).toBe(17);
			expect(relativeCount).toBe(1);
			expect(momentCount).toBe(10);

			let [locations, relatives] = await Promise.all([
				env.db.Location.all(),
				env.db.Relative.all()
			]);
			let promises = locations.map(async (location) => {
				let p = path.join(env.config.paths.library, location.path);
				expect(await fse.pathExists(p)).toBe(true);
			});
			promises.concat(relatives.map(async (relative) => {
				let p = path.join(env.config.paths.library, relative.path);
				expect(await fse.pathExists(p)).toBe(true);
			}));
			await Promise.all(promises);
		});

		it('should match existing files', async () => {
			const env = await setupFixtures();

			await (new SyncTask(env.config.paths.imports, env.db)).run();
			await (new SyncTask(env.config.paths.imports, env.db)).run();

			let [photoCount, locationCount, relativeCount] = await Promise.all([
				env.db.Photo.count(),
				env.db.Location.count(),
				env.db.Relative.count()
			]);

			assert.equal(photoCount, 16);
			assert.equal(locationCount, 17);
			assert.equal(relativeCount, 1);
		});

		it('should support cancellation', async () => {
			const env = await setupFixtures();
			let task = new SyncTask(env.config.paths.imports, env.db);
			task.start();
			task.cancel();
			await task.promise();
			let photoCount = await env.db.Photo.count();
			assert.equal(photoCount, 0);
		});
	});
});
