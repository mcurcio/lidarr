'use strict';

const path = require('path');

const async = require('async');
const fse = require('fs-extra');
const klaw = require('klaw');

const image = require('./image');

function syncFile(searchPath, destPath, file, db) {
	let subPath = file.substr(searchPath.length+1);
	let parts = subPath.split(path.sep);
	let newPath = path.join.apply(null, [destPath].concat(parts));

	let i = image(file);
	let stats;
	let photo;

	return i.stats().then((s) => {
		stats = s;
		return db.Photo.findAll({
			where: {
				hash: stats.hash
			}
		});
	}).then((photos) => {
		if (photos.length) {
			return photos[0];
		}

		return db.Photo.create({
			hash: stats.hash,
			width: stats.width,
			height: stats.height,
			type: stats.type,
			takenAt: stats.creation
		});
	}).then((photo_) => {
		photo = photo_;
		return fse.copy(file, newPath);
	}).then(() => {
		let location = new db.Location({ path: newPath});
		return location.save()
		/*return db.Location.create({
			path: newPath
		})*/.then((location) => {
			photo.addLocation(location);
		});
	});
};

function syncDirectory(searchPath, destPath, db) {
	const PARALLEL_COUNT = 10;

	return new Promise((resolve, reject) => {
		const queue = async.queue((file, cb) => {
			syncFile(searchPath, destPath, file, db)
				.then((val) => cb(null, val))
				.catch((err) => cb(err));
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

exports.file = syncFile;
exports.dir = syncDirectory;
