'use strict';

const momentjs = require('moment');
const path = require('path');

const database = require(libPath('db'));

describe('moment', () => {
	let db;
	let Moment;
	let Photo;

	beforeEach(async () => {
		let tmpDir = await makeTempDirectory();

		db = await database(path.join(tmpDir, 'db.sqlite'));
		await db.migrator.up();

		Moment = db.Moment;
		Photo = db.Photo;
	});

	it('should coalesce adjacent moments', async () => {
		let photo1 = await Photo.create({
			hash: "1",
			takenAt: momentjs("2017-01-01")
		});
		let moment1 = await photo1.getMoment();

		let start = momentjs(moment1.start);
		let end = momentjs(moment1.end);
		assert.ok(momentjs(photo1.takenAt).subtract(Moment.DURATION).isSame(start));
		assert.ok(momentjs(photo1.takenAt).add(Moment.DURATION).isSame(end));

		let photo2 = await Photo.create({
			hash: "2",
			takenAt: momentjs(photo1.takenAt).add(Moment.DURATION)
		});

		moment1 = await photo1.getMoment();
		start = momentjs(moment1.start);
		end = momentjs(moment1.end);
		assert.ok(momentjs(photo1.takenAt).subtract(Moment.DURATION).isSame(start));
		assert.ok(momentjs(photo2.takenAt).add(Moment.DURATION).isSame(end));

		// the two photos have the same timestamp, so should coalesce to one moment
		assert.equal(await Moment.count(), 1);

		let photo3 = await Photo.create({
			hash: "3",
			takenAt: momentjs(photo2.takenAt).add(Moment.DURATION)
		})

		assert.equal(await Moment.count(), 1);

		moment1 = await photo1.getMoment();
		start = momentjs(moment1.start);
		end = momentjs(moment1.end);
		assert.ok(momentjs(photo1.takenAt).subtract(Moment.DURATION).isSame(start));
		assert.ok(momentjs(photo3.takenAt).add(Moment.DURATION).isSame(end));

		assert.ok(moment1.inRange(photo1.takenAt));
		assert.ok(moment1.inRange(photo3.takenAt));

		// now add a photo way a bit out of range to create a new moment, and then
		// create another photo in the middle to coalesce the two connecting moments

		let photo4 = await Photo.create({
			hash: "4",
			takenAt: momentjs(photo3.takenAt).add(Moment.DURATION).add(Moment.DURATION)
		});

		assert.equal(await Moment.count(), 2);

		let photo5 = await Photo.create({
			hash: "5",
			takenAt: momentjs(photo3.takenAt).add(Moment.DURATION)
		});

		assert.equal(await Moment.count(), 1);

		moment1 = await photo1.getMoment();
		start = momentjs(moment1.start);
		end = momentjs(moment1.end);
		assert.ok(momentjs(photo1.takenAt).subtract(Moment.DURATION).isSame(start));
		assert.ok(momentjs(photo5.takenAt).add(Moment.DURATION).isSame(end));

		// removing photos from the middle should not split the moment once it
		// has been combined/coalesced

		await Promise.all([
			photo2.destroy(),
			photo3.destroy(),
			photo4.destroy()
		]);

		assert.equal(await Moment.count(), 1);

		moment1 = await photo1.getMoment();
		start = momentjs(moment1.start);
		end = momentjs(moment1.end);
		assert.ok(momentjs(photo1.takenAt).subtract(Moment.DURATION).isSame(start));
		assert.ok(momentjs(photo5.takenAt).add(Moment.DURATION).isSame(end));
	});

	describe('delete', () => {
		it('should cascade to connected photos', async () => {
			let moment = await Moment.create({
				start: momentjs("2017-01-01"),
				end: momentjs("2017-01-03")
			});

			let photo1 = await Photo.create({
				hash: "1",
				takenAt: momentjs("2017-01-02")
			});

			let [momentCount, photoCount] = await Promise.all([
				Moment.count(),
				Photo.count()
			]);

			assert.equal(momentCount, 1);
			assert.equal(photoCount, 1);

			await moment.destroy();

			[momentCount, photoCount] = await Promise.all([
				Moment.count(),
				Photo.count()
			]);

			assert.equal(momentCount, 0);
			assert.equal(photoCount, 0);
		});
	});

	it('should have hooks', async () => {
		return (async () => {
			let photo1 = await Photo.create({
				hash: "1",
				takenAt: momentjs("2017-01-01")
			});
			let photo2 = Photo.build({
				hash: "2",
				takenAt: momentjs("2017-01-02")
			});
			await photo2.save();

			assert.equal(await Moment.count(), 2);
			await photo1.destroy();
			assert.equal(await Moment.count(), 1);

			let moment3 = await Moment.create({
				start: momentjs(),
				end: momentjs()
			});
			assert.equal(await Moment.count(), 2);
			await photo2.setMoment(moment3);
			assert.equal(await Moment.count(), 1);
		})();
	});
});
