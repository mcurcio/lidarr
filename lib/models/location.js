module.exports = function(sequelize, types) {
    return sequelize.define("location", {
        path: types.STRING,
		original: types.STRING
    });
};
