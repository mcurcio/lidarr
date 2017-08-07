const momentjs = require('moment');

module.exports = function(sequelize, types) {
	const Moment = sequelize.define('moment', {
		name: types.STRING,
		start: {
			type: types.DATE,
			allowNull: false
		},
		end: {
			type: types.DATE,
			allowNull: false
		}
	});

	Moment.DURATION = momentjs.duration(2, 'seconds');

	Moment.prototype.inRange = function (test) {
		return momentjs(this.start).isSameOrBefore(test) &&
			momentjs(this.end).isSameOrAfter(test);
	};

	Moment.prototype.notifyAssetAdded = function (asset, {transaction}) {
		return (async () => {
			const bornAt = momentjs(asset.bornAt);
//			console.log('notifyAdded', takenAt, this.start, this.end);
			let start = this.start;
			if (bornAt.isSameOrBefore(start)) {
//				console.log('adjusting start');
				start = momentjs(bornAt).subtract(Moment.DURATION);
			}

			let end = this.end;
			if (bornAt.isSameOrAfter(end)) {
//				console.log('adjusting end');
				end = momentjs(bornAt).add(Moment.DURATION);
			}

//			console.log('adjusting range', start, end);
			await this.update({
				start,
				end
			}, {
				transaction
			});
		})();
	};

	Moment.prototype.notifyAssetRemoved = function (asset, {transaction}) {
		return (async () => {
			//console.log('notifyRemove', this.start, this.end);

			let assets = await this.getAssets();
			if (assets.length === 0) {
				await this.destroy({ transaction });
			} else {
				let timestamps = assets.map(a => momentjs(a.bornAt));
				await this.update({
					start: momentjs.min(timestamps).subtract(Moment.DURATION),
					end: momentjs.max(timestamps).add(Moment.DURATION)
				}, {
					transaction
				})
			}
		})();
	};
/*
	['beforeCreate',
	'beforeUpdate',
	'beforeDestroy',
	'beforeBulkCreate',
	'beforeBulkUpdate',
	'beforeBulkDestroy',
	'beforeSave',
	'beforeUpsert',

	'afterCreate',
	'afterUpdate',
	'afterDestroy',
	'afterBulkCreate',
	'afterBulkUpdate',
	'afterBulkDestroy',
	'afterSave',
	'afterUpsert'].forEach(fn => {
		Moment.hook(fn, moment => {
			console.log('moment.' + fn);
		});
	});

	Moment.hook('afterBulkUpdate', (attributes, where) => {
		console.log('afterBulkUpdate', attributes, where);
	});
*/
	return Moment;
};
