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
		const Asset = obj.Asset = sequelize.import('models/asset');
		const Instance = obj.Instance = sequelize.import('models/instance');
		const Thumbnail = obj.Thumbnail = sequelize.import('models/thumbnail');

		Asset.Moment = Asset.belongsTo(Moment, {
			hooks: true,
		});
		Moment.Assets = Moment.hasMany(Asset, {
			onDelete: 'cascade',
			hooks: true,
		});

		Moment.Camera = Moment.belongsTo(Camera);
		Camera.Moments = Camera.hasMany(Moment);

		Instance.Asset = Instance.belongsTo(Asset);
		Asset.Instances = Asset.hasMany(Instance);

		Thumbnail.Assets = Thumbnail.belongsTo(Asset);
		Asset.Thumbnails = Asset.hasMany(Thumbnail, {
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
