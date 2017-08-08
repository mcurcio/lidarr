module.exports = function(sequelize, types) {
    return sequelize.define("instance", {
        path: types.STRING,
        original: types.STRING
    });
};
