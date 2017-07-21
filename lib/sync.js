'use strict';

const path = require('path');

const async = require('async');
const fse = require('fs-extra');
const klaw = require('klaw');
const momentjs = require('moment');

const image = require('./image');

const PARALLEL_COUNT = 1;
const EXTENSIONS = ['jpg', 'jpeg', 'png'];

function syncFile(searchPath, assets, db, options={}) {
	if (!assets.photos.length) {
		return Promise.reject(new Error("Assets cannot be imported without a photo"));
	}

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

		let [photo, created] = await db.Photo.findOrCreate({
			where: {
				hash: stats.hash
			},
			defaults: {
				hash: stats.hash,
				width: stats.width,
				height: stats.height,
				type: stats.type,
				takenAt: stats.creation
			}
		});

		if (options.move) {
			newPhotoDir = options.move;
		}
		if (options.organize) {
			newPhotoFile = photo.properPath();
		}
		newPhotoPath = path.join(newPhotoDir, newPhotoFile);

		let locations = await photo.getLocations();
		let location = locations.find(l => {
			return l.path === photoFile || l.path === newPhotoFile ||
					l.original === photoFile || l.original === newPhotoFile;
		});
		if (!location) {
			// FIXME: try to update an orphaned db entry before creating a new one

			location = await db.Location.create({
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

					relative = await db.Relative.create({
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
	})().catch(e => console.log('error', e));
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

class Importer {
	constructor(searchPath, db, options={}) {
		options = Object.assign({
			move: null,
			organize: false
		}, options);

		this._quit = false;
		this.promise = new Promise((resolve, reject) => {
			const queue = async.queue((file, cb) => {
				syncFile(searchPath, file, db, options)
					.then((val) => {
						cb(null, val);
					})
					.catch((err) => {
						cb(err);
					});
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
						queue.drain = resolve;
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
