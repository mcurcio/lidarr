'use strict';

const fs = require('fs');

const imageSize = require('image-size');
const imageType = require('image-type');

const readFile = path => {
	return new Promise((resolve, reject) => {
		fs.readFile(path, (err, data) => {
			if (err) return reject(err);

			resolve(data);
		});
	});
};

class Image {
	constructor(path) {
		this._path = path;
		this._promise = readFile(path);
	}

	type() {
		return this._promise.then((buffer) => {
			const type = imageSize(buffer);
			return type && type.type;
		})
	}

	size() {
		return this._promise.then((buffer) => {
			const type = imageSize(buffer);
			return type && {width:type.width, height:type.height};
		});
	}
};

module.exports = path => {
	return new Image(path);
};
