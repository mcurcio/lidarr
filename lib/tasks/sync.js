'use strict';

const BaseTask = require('./base');

const async = require('async');
const {Emitter} = require('event-kit');
const fse = require('fs-extra');
const fsp = require('fs-plus');
const klaw = require('klaw');
const image = require('../image');
const momentjs = require('moment');
const path = require('path');

const PARALLEL_COUNT = 1;

module.exports = class SyncTask extends BaseTask {
	constructor(directory, env, options) {
		super();

		this._directory = directory;
		this._env = env;
		this._options = Object.assign({
			move: null,
			organize: false
		}, options);

		if (this._options.move && path.relative(this._options.move, this._directory) === "..") {
			reject(new Error("Import directory may not be within target directory"));
		}
	}

	_start() {
		const queue = async.queue((file, cb) => {
			if (this._canceled) {
				return cb();
			}

			this._env.logger.debug({assets: file}, "Syncing assets in directory");
			syncFile(this._directory, file, this._env, this._options)
				.then((val) => {
					//this._env.logger.debug("SyncFile done");
					cb(null, val);
				})
				.catch((err) => {
					this._env.logger.error({err}, "SyncFile error");
					cb(err);
				});
		}, PARALLEL_COUNT);
		this._queue = queue;

		return findFiles(this._directory)
			.then(files => {
				const photos = new Map();

				this._env.logger.debug({files: files.length}, "Found files for sync");

				for (let f of files) {
					const sub = path.relative(this._directory, f);
					const p = path.parse(sub);
					const isPhoto = fsp.isImageExtension(p.ext);
					const key = path.join(p.dir, p.name);

					if (!photos.has(key)) {
						photos.set(key, {
							photos: [],
							related: []
						});
					}

					photos.get(key)[isPhoto ? 'photos' : 'related'].push(f);
				}

				if (this._canceled) {
					return;
				}

				this._env.logger.debug({photos: photos.length}, "Queueing assets for sync");

				if (!photos.size) {
					return;
				}

				for (let [key, value] of photos) {
					if (this._canceled) {
						return;
					}

					if (value.photos.length) {
						queue.push(value);
					}
				}

				this._env.logger.debug("Done queueing assets for sync");

				if (this._canceled) {
					queue.remove(fn => true);
					return;
				}

				let resolve;
				let promise = new Promise(resolve_ => {
					resolve = () => {
						this._env.logger.debug("Queue drain");
						this._queue = null;

						resolve_();
					};
				});
				queue.drain = resolve;

				return promise;
			}).catch(err => this._env.logger.error({err}, "Sync task error"));
	}

	_cancel() {
		this._env.logger.debug("Canceling sync");

		if (this._queue) {
			let count = 0;
			this._queue.remove(fn => {
				++count;
				return true;
			});
			this._env.logger.debug({count}, "Cleared sync queue");
		}
	}
};

function syncFile(searchPath, assets, env, options={}) {
	if (!assets.photos.length) {
		return Promise.reject(new Error("Assets cannot be imported without a photo"));
	}

	const {Moment, Photo, Location, Relative} = env.db;

	// for now, throw out extra photos until I can figure out
	// a reasonable DB schema to associate everything
	let file = assets.photos[0];

	let photoDir = searchPath;
	let photoFile = file;
	let photoPath = path.join(photoDir, photoFile);

	// if the photo is moved or "organized", these values will be adjusted
	let newPhotoDir = photoDir;
	let newPhotoFile = photoFile;
	let newPhotoPath = photoPath;

	return (async () => {
		let i = image(photoPath);
		let stats = await i.stats();

		let [photo, created] = await Photo.findOrCreate({
			where: {
				hash: stats.hash
			},
			defaults: {
				hash: stats.hash,
				width: stats.width,
				height: stats.height,
				type: stats.type,
				takenAt: stats.creation
			},
			env
		});
		env.logger.debug({created, photo}, "Created photo");

		if (options.move) {
			newPhotoDir = options.move;
		}
		if (options.organize) {
			newPhotoFile = photo.properPath();
		}
		newPhotoPath = path.join(newPhotoDir, newPhotoFile);
		env.logger.debug({curPath: photoPath, newPath: newPhotoPath}, "Photo organization target");

		let locations = await photo.getLocations();
		let location = locations.find(l => {
			return l.path === photoFile || l.path === newPhotoFile ||
					l.original === photoFile || l.original === newPhotoFile;
		});
		if (!location) {
			// FIXME: try to update an orphaned db entry before creating a new one

			location = await Location.create({
				photoId: photo.id,
				path: photoFile,
				original: photoFile
			});
		}

		if (photoPath !== newPhotoPath) {
			await fse.copy(photoPath, newPhotoPath);
			location.path = newPhotoFile;
			await location.save();
			await fse.remove(photoPath);
		}

		let relatives = [];
		for (let asset of assets.related) {
			let promise = (async function () {
				let assetFile = asset;
				let assetDir = photoDir;
				let assetPath = path.join(assetDir, assetFile);

				let newAssetFile = assetFile;
				let newAssetDir = assetDir;
				let newAssetPath = path.join(newAssetDir, newAssetFile);

				if (options.move) {
					newAssetDir = options.move;
				}
				if (options.organize) {
					let locationParts = path.parse(assetFile);
					let photoParts = path.parse(newPhotoFile);
					newAssetFile = path.join(photoParts.dir, photoParts.name + locationParts.ext);
				}
				newAssetPath = path.join(newAssetDir, newAssetFile);

				let relatives = await photo.getRelatives();
				let relative = relatives.find(r => {
					return r.path === assetFile || r.path === newAssetFile ||
							r.original === assetFile || r.original === newAssetFile;
				});

				if (!relative) {
					// FIXME: try to update an orphaned db entry before creating a new one

					relative = await Relative.create({
						photoId: photo.id,
						path: assetFile,
						original: assetFile
					});
				}

				if (assetPath !== newAssetPath) {
					await fse.copy(assetPath, newAssetPath);
					relative.path = newAssetFile;
					await relative.save();
					await fse.remove(assetPath);
				}
			})();

			relatives.push(promise);
		}
		await Promise.all(relatives);
	})().catch(err => env.logger.error({err}, "SyncFile error"));
};

function findFiles(directory) {
	return new Promise((resolve, reject) => {
		const files = [];

		klaw(directory)
			.on('readable', function () {
				let file;
				while (file = this.read()) {
					if (!file.stats.isDirectory()) {
						files.push(path.relative(directory, file.path));
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
