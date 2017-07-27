'use strict';

const fse = require('fs-extra');
const path = require('path');

const {SyncTask} = require(libPath('task'));

describe('import', () => {
	let tenv;
	let tenvs = [];
	
	beforeEach(async () => {
		tenv = await TestEnvironment.create();
		tenvs.push(tenv);
	});

	afterAll(async () => {
		return Promise.all(tenvs.map(e => e.destroy()));
	});

	describe('importer', () => {
		it('should work', async () => {
			await (new SyncTask(tenv.config.paths.imports, tenv.env, {move: tenv.config.paths.library})).run();

			let [photoCount, locationCount, relativeCount, momentCount] = await Promise.all([
				tenv.db.Photo.count(),
				tenv.db.Location.count(),
				tenv.db.Relative.count(),
				tenv.db.Moment.count()
			]);
			expect(photoCount).toBe(16);
			expect(locationCount).toBe(17);
			expect(relativeCount).toBe(1);
			expect(momentCount).toBe(10);

			let [locations, relatives] = await Promise.all([
				tenv.db.Location.all(),
				tenv.db.Relative.all()
			]);
			let promises = locations.map(async (location) => {
				let p = path.join(tenv.config.paths.library, location.path);
				expect(await fse.pathExists(p)).toBe(true);
			});
			promises.concat(relatives.map(async (relative) => {
				let p = path.join(tenv.config.paths.library, relative.path);
				expect(await fse.pathExists(p)).toBe(true);
			}));
			await Promise.all(promises);
		});

		it('should match existing files', async () => {
			await (new SyncTask(tenv.config.paths.imports, tenv.env)).run();
			await (new SyncTask(tenv.config.paths.imports, tenv.env)).run();

			let [photoCount, locationCount, relativeCount] = await Promise.all([
				tenv.db.Photo.count(),
				tenv.db.Location.count(),
				tenv.db.Relative.count()
			]);

			assert.equal(photoCount, 16);
			assert.equal(locationCount, 17);
			assert.equal(relativeCount, 1);
		});

		it('should support cancellation', async () => {
			let task = new SyncTask(tenv.config.paths.imports, tenv.env);
			task.start();
			task.cancel();
			await task.promise();
			let photoCount = await tenv.db.Photo.count();
			assert.equal(photoCount, 0);
		});
	});
});
