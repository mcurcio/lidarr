module.exports = function(sequelize, types) {
	const Relative = sequelize.define('relative', {
		path: types.STRING,
		original: types.STRING,
		name: types.STRING
	});

	return Relative;
};
