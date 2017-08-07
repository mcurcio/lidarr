'use strict';

const momentjs = require('moment');
const path = require('path');

const database = require(libPath('db'));

describe('moment', () => {
	let db;
	let Moment;
	let Asset;

	beforeEach(async () => {
		let tmpDir = await makeTempDirectory();

		db = await database(path.join(tmpDir, 'db.sqlite'));
		await db.migrator.up();

		Moment = db.Moment;
		Asset = db.Asset;
	});

	it('should coalesce adjacent moments', async () => {
		let asset1 = await Asset.create({
			hash: "1",
			bornAt: momentjs("2017-01-01")
		});
		let moment1 = await asset1.getMoment();

		let start = momentjs(moment1.start);
		let end = momentjs(moment1.end);
		assert.ok(momentjs(asset1.bornAt).subtract(Moment.DURATION).isSame(start));
		assert.ok(momentjs(asset1.bornAt).add(Moment.DURATION).isSame(end));

		let asset2 = await Asset.create({
			hash: "2",
			bornAt: momentjs(asset1.bornAt).add(Moment.DURATION)
		});

		moment1 = await asset1.getMoment();
		start = momentjs(moment1.start);
		end = momentjs(moment1.end);
		assert.ok(momentjs(asset1.bornAt).subtract(Moment.DURATION).isSame(start));
		assert.ok(momentjs(asset2.bornAt).add(Moment.DURATION).isSame(end));

		// the two assets have the same timestamp, so should coalesce to one moment
		assert.equal(await Moment.count(), 1);

		let asset3 = await Asset.create({
			hash: "3",
			bornAt: momentjs(asset2.bornAt).add(Moment.DURATION)
		})

		assert.equal(await Moment.count(), 1);

		moment1 = await asset1.getMoment();
		start = momentjs(moment1.start);
		end = momentjs(moment1.end);
		assert.ok(momentjs(asset1.bornAt).subtract(Moment.DURATION).isSame(start));
		assert.ok(momentjs(asset3.bornAt).add(Moment.DURATION).isSame(end));

		assert.ok(moment1.inRange(asset1.bornAt));
		assert.ok(moment1.inRange(asset3.bornAt));

		// now add an asset a bit out of range to create a new moment, and then
		// create another asset in the middle to coalesce the two connecting moments

		let asset4 = await Asset.create({
			hash: "4",
			bornAt: momentjs(asset3.bornAt).add(Moment.DURATION).add(Moment.DURATION)
		});

		assert.equal(await Moment.count(), 2);

		let asset5 = await Asset.create({
			hash: "5",
			bornAt: momentjs(asset3.bornAt).add(Moment.DURATION)
		});

		assert.equal(await Moment.count(), 1);

		moment1 = await asset1.getMoment();
		start = momentjs(moment1.start);
		end = momentjs(moment1.end);
		assert.ok(momentjs(asset1.bornAt).subtract(Moment.DURATION).isSame(start));
		assert.ok(momentjs(asset5.bornAt).add(Moment.DURATION).isSame(end));

		// removing assets from the middle should not split the moment once it
		// has been combined/coalesced

		await Promise.all([
			asset2.destroy(),
			asset3.destroy(),
			asset4.destroy()
		]);

		assert.equal(await Moment.count(), 1);

		moment1 = await asset1.getMoment();
		start = momentjs(moment1.start);
		end = momentjs(moment1.end);
		assert.ok(momentjs(asset1.bornAt).subtract(Moment.DURATION).isSame(start));
		assert.ok(momentjs(asset5.bornAt).add(Moment.DURATION).isSame(end));
	});

	describe('delete', () => {
		it('should cascade to connected assets', async () => {
			let moment = await Moment.create({
				start: momentjs("2017-01-01"),
				end: momentjs("2017-01-03")
			});

			let asset1 = await Asset.create({
				hash: "1",
				bornAt: momentjs("2017-01-02")
			});

			let [momentCount, assetCount] = await Promise.all([
				Moment.count(),
				Asset.count()
			]);

			assert.equal(momentCount, 1);
			assert.equal(assetCount, 1);

			await moment.destroy();

			[momentCount, assetCount] = await Promise.all([
				Moment.count(),
				Asset.count()
			]);

			assert.equal(momentCount, 0);
			assert.equal(assetCount, 0);
		});
	});

	it('should have hooks', async () => {
		return (async () => {
			let asset1 = await Asset.create({
				hash: "1",
				bornAt: momentjs("2017-01-01")
			});
			let asset2 = Asset.build({
				hash: "2",
				bornAt: momentjs("2017-01-02")
			});
			await asset2.save();

			assert.equal(await Moment.count(), 2);
			await asset1.destroy();
			assert.equal(await Moment.count(), 1);

			let moment3 = await Moment.create({
				start: momentjs(),
				end: momentjs()
			});
			assert.equal(await Moment.count(), 2);
			await asset2.setMoment(moment3);
			assert.equal(await Moment.count(), 1);
		})();
	});
});
