'use strict';

module.exports = function (sequelize, types) {
	const Thumbnail = sequelize.define("thumbnail", {
		uuid: {
			type: types.UUID,
			defaultValue: types.UUIDV4,
			unique: true
		},
		width: types.INTEGER,
		height: types.INTEGER
	});

	return Thumbnail;
};
