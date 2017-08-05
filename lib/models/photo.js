const path = require('path');

const momentjs = require('moment');

module.exports = function(sequelize, types) {
	const Photo = sequelize.define("photo", {
		uuid: {
			type: types.UUID,
			defaultValue: types.UUIDV4,
			unique: true
		},
		hash: {
			type: types.STRING(128),
			unique: true
		},
		type: types.STRING(6),
		width: types.INTEGER,
		height: types.INTEGER,
		takenAt: types.DATE
	});

	Photo.prototype.properPath = function () {
		if (this.takenAt) {
			const takenAt = momentjs(this.takenAt);
			const year = takenAt.format("YYYY");
			const month = takenAt.format("MM-MMM");
			const time = takenAt.format("YYYY.MM.DD.HH.mm.ss.SS");
			const uuid = this.uuid.substr(0, 6);
			const file = time + '.' + uuid + '.' + this.type;

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
	Photo.hook('afterDestroy', (photo, options) => {
		return (async () => {
			let moment = await photo.getMoment();
			if (moment) {
				await moment.notifyPhotoRemoved(photo, options);
			}
		})();
	});

	Photo.hook('afterUpdate', (photo, options) => {
		const Moment = sequelize.models.moment;
		return (async () => {
			if (options.fields.includes('momentId')) {
				await Promise.all([
					(async () => {
						let m = await Moment.findById(photo.previous('momentId'));
						await m.notifyPhotoRemoved(photo, options);
					})(),
					(async () => {
						let m = await Moment.findById(photo.momentId);
						await m.notifyPhotoAdded(photo, options);
					})()
				]);
			}
		})();
	});

	Photo.hook('beforeCreate', (photo, options) => {
		const Moment = sequelize.models.moment;

		return (async () => {
			let moments = await Moment.findAll({
				where: {
					start: {
						$lte: photo.takenAt
					},
					end: {
						$gte: photo.takenAt
					}
				}
			}, {
				transaction: options.transaction
			});

			switch (moments.length) {
				case 0:
					let m = await Moment.create({
						start: momentjs(photo.takenAt).subtract(Moment.DURATION),
						end: momentjs(photo.takenAt).add(Moment.DURATION)
					}, {
						transaction: options.transaction
					});
					await photo.setMoment(m, { save: false });
					break;

				case 1:
					await photo.setMoment(moments[0], { save: false });
					break;

				default:
					let moment = moments.shift();
					let photos = await moment.getPhotos({ transaction: options.transaction });
					let otherPhotos = await Promise.all(moments.map(async (m) => {
						let p = await m.getPhotos({ transaction: options.transaction });
						await m.removePhotos(p, { transaction: options.transaction });
						return p;
					}));
					photos.concat(otherPhotos);
					await Promise.all(moments.map(m => m.destroy({ transaction: options.transaction })));
					await moment.setPhotos(photos, { transaction: options.transaction });
					photo.setMoment(moment, { save: false, transaction: options.transaction });

			}
		})();
	});

	Photo.hook('afterCreate', (photo, { transaction }) => {
		return (async () => {
			let moment = await photo.getMoment({ transaction });
			await moment.notifyPhotoAdded(photo, { transaction });
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
	return Photo;
};
