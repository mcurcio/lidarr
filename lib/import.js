'use strict';

const path = require('path');

const async = require('async');
const fse = require('fs-extra');
const klaw = require('klaw');

const image = require('./image');

function import_(searchPath, destPath, db) {
	const PARALLEL_COUNT = 10;

	return new Promise((resolve, reject) => {
		const queue = async.queue((file, cb) => {
			let subPath = file.substr(searchPath.length+1);
			let parts = subPath.split(path.sep);
			let newPath = path.join.apply(null, [destPath].concat(parts));

			let i = image(file);
			let hash;
			let photo;

			i.hash().then((hash_) => {
				hash = hash_;
				return db.Photo.findAll({
					where: {
						hash
					}
				});
			}).then((photos) => {
				if (photos.length) {
					return photos[0];
				}

				return db.Photo.create({
					hash
				});
			}).then((photo_) => {
				photo = photo_;
				return fse.copy(file, newPath);
			}).then(() => {
				return photo.addLocation(new db.Location({ path: newPath }));
			}).then(() => {
				cb();
			}).catch(cb);
		}, PARALLEL_COUNT);

		klaw(searchPath)
			.on('readable', function () {
				let file;
				while (file = this.read()) {
					if (!file.stats.isDirectory()) {
						queue.push(file.path);
					}
				}
			})
			.on('error', function (err, item) {
				reject(err);
			})
			.on('end', function () {
				queue.drain = () => {
					resolve();
				};
			});
	});
}
module.exports = import_;
