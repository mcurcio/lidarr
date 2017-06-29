'use strict';

const path = require('path');

const async = require('async');
const fse = require('fs-extra');
const klaw = require('klaw');

const image = require('./image');

function syncFile(searchPath, destPath, file, db) {
	let i = image(file);
	let stats;

	return i.stats().then((s) => {
		stats = s;
		return db.Photo.findAll({
			where: {
				hash: stats.hash
			}
		});
	}).then((photos) => {
		if (photos.length) {
			// do nothing on duplicate photo
			return;
		}

		return db.Photo.create({
			hash: stats.hash,
			width: stats.width,
			height: stats.height,
			type: stats.type,
			takenAt: stats.creation
		}).then((photo) => {
			const path_ = path.join(destPath, photo.properPath());

			return fse.copy(file, path_).then(() => {
				let location = new db.Location({ path: path_ });
				return location.save()
			});
		});
	}).catch((e) => {
		if (e instanceof image.NotAnImageError) {
			return Promise.reject(e);
		}

		console.error('syncFile error', e);

		return Promise.resolve();
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
