module.exports = function(sequelize, types) {
    return sequelize.define("photo", {
        uuid: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            unique: true
        },
        hash: {
            type: types.STRING(128),
            unique: true
        },
        path: types.STRING,
        thumbnail: types.STRING,
        takenAt: types.DATE
    });
};
