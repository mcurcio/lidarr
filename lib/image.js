'use strict';

const fse = require('fs-extra');

const checksum = require('checksum');
const exif = require('exif');
const imageSize = require('image-size');
const moment = require('moment');

class Image {
	constructor(path) {
		this._path = path;
		this._promise = fse.readFile(path);
			// TODO: extend promise to check that file is image
	}

	stats() {
		return this._promise.then((buffer) => {
			try {
				const type = imageSize(buffer);

				const fileCreationPromise = fse.stat(this._path)
					.then((data) => {
						return data.birthtime;
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

	hash() {
		return this._promise.then((buffer) => {
			return Promise.resolve(checksum(buffer, {algorithm: 'sha512'}));
		});
	}
};

module.exports = path => {
	return new Image(path);
};
