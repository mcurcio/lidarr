const path = require('path');

const moment = require('moment');

module.exports = function(sequelize, types) {
	const Photo = sequelize.define("photo", {
		uuid: {
			type: types.UUID,
			defaultValue: types.UUIDV4,
			unique: true
		},
		hash: {
			type: types.STRING(128),
			unique: true
		},
		type: types.STRING(6),
		width: types.INTEGER,
		height: types.INTEGER,
		takenAt: types.DATE
	});

	Photo.prototype.properPath = function () {
		if (this.takenAt) {
			const takenAt = moment(this.takenAt);
			const year = takenAt.format("YYYY");
			const month = takenAt.format("MM");
			const time = takenAt.format("DD.HHmmss.SSSS");
			const uuid = this.uuid.substr(0, 6);
			const file = time + '.' + uuid + '.' + this.type;

			return path.join(year, month, file);
		}

		return null;
	};

	return Photo;
};
