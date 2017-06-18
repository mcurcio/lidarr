'use strict';

const fs = require('fs');

const exif = require('exif');
const imageSize = require('image-size');
const moment = require('moment');

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

	stats() {
		return this._promise.then((buffer) => {
			try {
				const type = imageSize(buffer);

				const fileCreationPromise = new Promise((resolve, reject) => {
					fs.stat(this._path, (err, data) => {
						if (err) return reject(err);
						resolve(data.birthtime);
					});
				});

				const metadataPromise = new Promise((resolve, reject) => {
					exif({image: buffer}, (err, data) => {
						if (err) return resolve({});
						resolve(data);
					});
				});

				return Promise.all([
					metadataPromise,
					fileCreationPromise
				]).then(([meta, creation]) => {
					let date = creation;
					const string = meta.exif.DateTimeOriginal;
					const test = moment(string, "YYYY:MM:DD HH:mm:ss");
					if (test.isValid()) {
						date = test.toDate();
					}

					type.creation = date;
					type.exif = meta;
					return type;
				});
			} catch (e) {
				return null;
			}
		});
	}
};

module.exports = path => {
	return new Image(path);
};
