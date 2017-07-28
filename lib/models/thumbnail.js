'use strict';

const path = require('path');

module.exports = function (sequelize, types) {
	const Thumbnail = sequelize.define("thumbnail", {
		uuid: {
			type: types.UUID,
			defaultValue: types.UUIDV4,
			unique: true
		},
		ext: types.STRING(10),
		width: types.INTEGER,
		height: types.INTEGER
	});

	Thumbnail.sizes = [300, 800];

	Thumbnail.prototype.min = function () {
		return Math.min(this.width, this.height);
	}

	Thumbnail.prototype.path = function () {
		return path.join(this.uuid.substr(0, 2),
			this.uuid.substr(2) + '.' + this.ext);
	};

	return Thumbnail;
};
