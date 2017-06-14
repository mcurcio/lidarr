'use strict';

const Sequelize = require('sequelize');

module.exports = (name, logger) => {
    const sequelize = new Sequelize(name.toLowerCase, '', '', {
        host: 'localhost',
        dialect: 'sqlite',

        logging: msg => logger.trace(msg),
        pool: {
            max: 5,
            min: 0,
            idle: 10000
        },

        // SQLite only
        storage: 'data/db.sqlite'
    });

    let obj = {};

    obj.sequelize = sequelize;
    obj.Sequelize = Sequelize;

    const Camera = obj.Camera = sequelize.import('models/camera');
    const Photo = obj.Photo = sequelize.import('models/photo');

    Camera.Photos = Photo.belongsTo(Camera);
    Photo.Camera = Camera.hasMany(Photo);

    return sequelize.sync().then(() => {
        return obj;
    });
};
