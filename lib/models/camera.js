module.exports = function(sequelize, types) {
    return sequelize.define("camera", {
        name: types.STRING
    });
};
