const momentjs = require('moment');
const path = require('path');

module.exports = function(sequelize, types) {
	const Asset = sequelize.define("asset", {
		uuid: {
			type: types.UUID,
			defaultValue: types.UUIDV4,
			unique: true,
			allowNull: false,
			validate: {
				isUUID: 4
			}
		},
		hash: {
			type: types.STRING(128),
			unique: true,
			allowNull: false
		},
		type: {
			type: types.ENUM('image', 'video', 'raw'),
			allowNull: false,
			validate: {
				isIn: [['image', 'video', 'raw']]
			}
		},
		format: {
			type: types.STRING(10),
			allowNull: false,
			validate: {
				isAlpha: true
			}
		},
		width: {
			type: types.INTEGER,
			allowNull: false
		},
		height: {
			type: types.INTEGER,
			allowNull: false
		},
		orientation: {
			type: types.INTEGER,
			allowNull: false,
			defaultValue: 1,
			validate: {
				min: 1,
				max: 8
			}
		},
		landscape: {
			type: types.BOOLEAN,
			allowNull: false
		},
		exif: types.JSON,
		bornAt: {
			type: types.DATE,
			allowNull: true,
			validate: {
				isDate: true
			}
		}
	}, {
		//paranoid: true TODO
	});

	Asset.FILE_DATE_FORMATS = [
		"YYYY.MM.DD.HH.mm.ss.SSSSZZ"
	];

	Asset.formatToExtension = function (format) {
		return format.toLowerCase();
	};

	Asset.prototype.canonicalPath = function () {
		const t = this.bornAt || this.createdAt;

		if (t) {
			const m = momentjs(t);
			const year = m.format("YYYY");
			const month = m.format("MM-MMM");
			const time = m.format(Asset.FILE_DATE_FORMATS[0]);
			const uuid = this.uuid.substr(0, 6);
			const file = time + '.' + uuid + '.' +
				Asset.formatToExtension(this.format);

			return path.join(year, month, file);
		}

		return null;
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
		Photo.hook(fn, photo => {
			console.log('photo.' + fn);
		});
	});
*/

	Asset.hook('beforeValidate', (asset, {transaction}) => {
		switch (asset.orientation) {
			case 6:
			case 8:
				// these orientations indicate rotation, so the natural
				// asset must be taller than it is wide in order to rotate
				// into the landscape orientation
				asset.landscape = asset.height >= asset.width;
				break;

			default:
				asset.landscape = asset.width >= asset.height;
		}
	});

	Asset.hook('afterDestroy', (asset, options) => {
		return (async () => {
			let moment = await asset.getMoment();
			if (moment) {
				await moment.notifyAssetRemoved(asset, options);
			}
		})();
	});

	Asset.hook('afterUpdate', (asset, options) => {
		const Moment = sequelize.models.moment;
		return (async () => {
			if (options.fields.includes('momentId')) {
				await Promise.all([
					(async () => {
						let m = await Moment.findById(asset.previous('momentId'));
						await m.notifyAssetRemoved(asset, options);
					})(),
					(async () => {
						let m = await Moment.findById(asset.momentId);
						await m.notifyAssetAdded(asset, options);
					})()
				]);
			}
		})();
	});

	Asset.hook('beforeCreate', (asset, options) => {
		const Moment = sequelize.models.moment;

		return (async () => {
			let moments = await Moment.findAll({
				where: {
					start: {
						$lte: asset.bornAt
					},
					end: {
						$gte: asset.bornAt
					}
				}
			}, {
				transaction: options.transaction
			});

			switch (moments.length) {
				case 0:
					let m = await Moment.create({
						start: momentjs(asset.bornAt).subtract(Moment.DURATION),
						end: momentjs(asset.bornAt).add(Moment.DURATION)
					}, {
						transaction: options.transaction
					});
					await asset.setMoment(m, { save: false });
					break;

				case 1:
					await asset.setMoment(moments[0], { save: false });
					break;

				default:
					let moment = moments.shift();
					let assets = await moment.getAssets({ transaction: options.transaction });
					let otherAssets = await Promise.all(moments.map(async (m) => {
						let a = await m.getAssets({ transaction: options.transaction });
						await m.removeAssets(a, { transaction: options.transaction });
						return a;
					}));
					assets.concat(otherAssets);
					await Promise.all(moments.map(m => m.destroy({ transaction: options.transaction })));
					await moment.setAssets(assets, { transaction: options.transaction });
					asset.setMoment(moment, { save: false, transaction: options.transaction });

			}
		})();
	});

	Asset.hook('afterCreate', (asset, { transaction }) => {
		return (async () => {
			let moment = await asset.getMoment({ transaction });
			await moment.notifyAssetAdded(asset, { transaction });
		})();
	});
/*
	Photo.hook('beforeBulkUpdate', function (attributes, where) {
		console.log('****** beforeBulkUpdate', attributes);/*
	});

	Photo.hook('afterBulkUpdate', (attributes, where) => {
		console.log('***** afterBulkUpdate', attributes, where);
	});
*/
	return Asset;
};
