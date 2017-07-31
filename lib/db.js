'use strict';

const path = require('path');

const Sequelize = require('sequelize');
const Umzug = require('umzug');

function noop() {}

module.exports = (file, options) => {
	let logger;
	if (options && options.logger) {
		logger = options.logger.child({db:file});
	}
	let logging = () => {};
	if (logger) {
		logging = (msg) => logger.trace(msg);
	}

	return new Promise((resolve, reject) => {
		if (!file) {
			return reject(new Error("Missing database path"));
		}

		const name = path.parse(file).name;
		if (name.split('.').length > 1) {
			return reject(new Error('Database path has two periods in filename'));
		}

		const sequelize = new Sequelize(name, '', '', {
			host: 'localhost',
			dialect: 'sqlite',
			storage: file,

			logging,
			pool: {
				min: 0,
				max: 5,
				//acquire: 1000
			},/*
			retry: {
				max: 10
			}*/
		});

		let obj = {
			close: () => {
				sequelize.close();
			}
		};

		obj.sequelize = sequelize;
		obj.Sequelize = Sequelize;

		const Camera = obj.Camera = sequelize.import('models/camera');
		const Moment = obj.Moment = sequelize.import('models/moment');
		const Photo = obj.Photo = sequelize.import('models/photo');
		const Location = obj.Location = sequelize.import('models/location');
		const Relative = obj.Relative = sequelize.import('models/relative');
		const Thumbnail = obj.Thumbnail = sequelize.import('models/thumbnail');

		Photo.Moment = Photo.belongsTo(Moment, {
			hooks: true,
		});
		Moment.Photos = Moment.hasMany(Photo, {
			onDelete: 'cascade',
			hooks: true,
		});

		Moment.Camera = Moment.belongsTo(Camera);
		Camera.Moments = Camera.hasMany(Moment);

		Location.Photo = Location.belongsTo(Photo);
		Photo.Locations = Photo.hasMany(Location);

		Relative.Photo = Relative.belongsTo(Photo);
		Photo.Relatives = Photo.hasMany(Relative, {
			onDelete: 'cascade',
			hooks: true
		});

		Thumbnail.Photos = Thumbnail.belongsTo(Photo);
		Photo.Thumbnails = Photo.hasMany(Thumbnail, {
			onDelete: 'cascade',
			hooks: true
		});

		obj.migrator = new Umzug({
			storage: 'sequelize',
			storageOptions: {
				sequelize,
				modelName: '_migration_versions',
				columnName: 'version',
				timestamps: true
			},
			migrations: {
				params: [sequelize.getQueryInterface(), Sequelize],
				path: path.resolve(path.join(__filename, '..', 'models', 'migrations'))
			}
		});

		resolve(obj);
	});
};
