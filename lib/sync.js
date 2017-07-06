'use strict';

const path = require('path');

const async = require('async');
const fse = require('fs-extra');
const klaw = require('klaw');

const image = require('./image');

function syncFile(file, destPath, db) {
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

			return fse.copy(file, path_)
				.then(() => fse.remove(file))
				.then(() => db.Location.create({ path: path_ }));
		});
	}).catch((e) => {
		if (e instanceof image.NotAnImageError) {
			return Promise.reject(e);
		}

		console.error('syncFile error', e);

		return Promise.resolve();
	});
};

class Importer {
	constructor(searchPath, destPath, db) {
		const PARALLEL_COUNT = 20;

		this._quit = false;
		this.promise = new Promise((resolve, reject) => {
			const queue = async.queue((file, cb) => {
				syncFile(file, destPath, db)
					.then((val) => cb(null, val))
					.catch((err) => cb(err));
			}, PARALLEL_COUNT);

			klaw(searchPath)
				.on('readable', function () {
					let file;
					while (file = this.read()) {
						if (this._quit) {
							continue;
						}

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

	cancel() {
		this._quit = true;
	}
};

function syncDirectory(searchPath, destPath, db) {
	return new Importer(searchPath, destPath, db);
}

exports.file = syncFile;
exports.dir = syncDirectory;
