'use strict';

const path = require('path');

const Sequelize = require('sequelize');
const Umzug = require('umzug');

function noop() {}

module.exports = (file, logger=noop) => {
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

            logging: logger,
            pool: {
                max: 5,
                min: 0,
                idle: 10000
            },

            // SQLite only
            storage: file
        });

        let obj = {};

        obj.sequelize = sequelize;
        obj.Sequelize = Sequelize;

        const Camera = obj.Camera = sequelize.import('models/camera');
        const Photo = obj.Photo = sequelize.import('models/photo');
        const Location = obj.Location = sequelize.import('models/location');

        Photo.belongsTo(Camera);
		Photo.hasMany(Location);
        //Location.belongsTo(Photo);

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
