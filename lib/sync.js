'use strict';

const path = require('path');

const async = require('async');
const fse = require('fs-extra');
const klaw = require('klaw');
const momentjs = require('moment');

const image = require('./image');

const PARALLEL_COUNT = 1;
const EXTENSIONS = ['jpg', 'jpeg', 'png'];

function syncFile(assets, destPath, db, options={}) {
	if (!assets.photos.length) {
		return Promise.reject(new Error("Assets cannot be imported without a photo"));
	}

	// for now, throw out extra photos until I can figure out
	// a reasonable DB schema to associate everything
	let file = assets.photos[0];

	return (async () => {
		let i = image(file);
		let stats = await i.stats();

		let photos = await db.Photo.findAll({
			where: {
				hash: stats.hash
			}
		});

		let photo;

		if (photos.length) {
			// do nothing on duplicate photo
			photo = photos[0];
		} else {
			photo = await db.Photo.create({
				hash: stats.hash,
				width: stats.width,
				height: stats.height,
				type: stats.type,
				takenAt: stats.creation
			});
		}

		let path_ = file;
		if (options.move) {
			path_ = path.join(destPath, photo.properPath());
			await fse.copy(file, path_);
			await fse.remove(file);
			path_ = photo.properPath();
		}

		let location = await db.Location.create({
			photoId: photo.id,
			path: path_,
			original: file
		});

		let relatives = [];
		for (let asset of assets.related) {
			let promise = (async function () {
				let relative = await db.Relative.create({
					photoId: photo.id,
					path: asset,
					original: asset
				});

				if (options.move) {
					let parts = path.parse(asset);
					let locParts = path.parse(location.path);
					let path_ = path.join(locParts.dir, locParts.name + parts.ext);

					await fse.copy(asset, path.join(destPath, path_));
					await fse.remove(asset);
					relative.path = path_;
					await relative.save();
				}
			})();

			relatives.push(promise);
		}
		await Promise.all(relatives);
	})().catch(e => {
		console.error('syncFile error', e);
	});
};

function findFiles(path) {
	return new Promise((resolve, reject) => {
		const files = [];

		klaw(path)
			.on('readable', function () {
				let file;
				while (file = this.read()) {
					if (!file.stats.isDirectory()) {
						files.push(file.path);
					}
				}
			})
			.on('error', function (err, item) {
				reject(err);
			})
			.on('end', function () {
				resolve(files);
			});
	});
}

class Importer {
	constructor(searchPath, destPath, db, options={}) {
		options = Object.assign({
			move: false
		}, options);

		this._quit = false;
		this.promise = new Promise((resolve, reject) => {
			const queue = async.queue((file, cb) => {
				syncFile(file, destPath, db, options)
					.then((val) => cb(null, val))
					.catch((err) => cb(err));
			}, PARALLEL_COUNT);

			findFiles(searchPath)
				.then(files => {
					const SEARCH_PATH_LEN = searchPath.length;

					const photos = new Map();

					for (var f of files) {
						const sub = path.relative(searchPath, f);
						const p = path.parse(sub);
						const isPhoto = EXTENSIONS.includes(p.ext.substring(1).toLowerCase());
						const key = path.join(p.dir, p.name);

						if (!photos.has(key)) {
							photos.set(key, {
								photos: [],
								related: []
							});
						}

						photos.get(key)[isPhoto ? 'photos' : 'related'].push(f);
					}

					if (this._quit) {
						return Promise.resolve();
					}

					for (let [key, value] of photos) {
						if (value.photos.length) {
							queue.push(value);
						}
					}

					return new Promise((resolve, reject) => {
						queue.drain = () => {
							resolve();
						};
					});
				})
				.then(resolve, reject);
		});
	}

	cancel() {
		this._quit = true;
	}
};

function syncDirectory(searchPath, destPath, db, options) {
	return new Importer(searchPath, destPath, db, options);
}

exports.file = syncFile;
exports.dir = syncDirectory;
