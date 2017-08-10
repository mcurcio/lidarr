'use strict';

const BaseTask = require('./base');

const async = require('async');
const checksum = require('checksum');
const {Emitter} = require('event-kit');
const {exiftool} = require('exiftool-vendored');
const fse = require('fs-extra');
const fsp = require('fs-plus');
const klaw = require('klaw');
const image = require('../image');
const momentjs = require('moment');
const path = require('path');

const PARALLEL_COUNT = 1;

function sha512(file) {
	return new Promise((resolve, reject) => {
		checksum.file(file, {algorithm: 'sha512'}, (err, hash) => {
			if (err) return reject(err);
			resolve(hash);
		});
	});
}

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
		const queue = async.queue((assets, cb) => {
			if (this._canceled) {
				return cb();
			}

			// convert Set to Array
			assets = [...assets];

			this._env.logger.debug({files: assets}, "Syncing assets in directory");
			syncFile(this._directory, assets, this._env, this._options)
				.then((val) => {
					//this._env.logger.debug("SyncFile done");
					setTimeout(() => {
						cb(null, val);
					}, 0);
				})
				.catch((err) => {
					this._env.logger.error({err}, "SyncFile error");
					cb(err);
				});
		}, PARALLEL_COUNT);
		this._queue = queue;

		return findFiles(this._directory)
			.then(files => {
				const assets = new Map();

				this._env.logger.debug({files: files.length}, "Found files for sync");

				for (let f of files) {
					const sub = path.relative(this._directory, f);
					const p = path.parse(sub);
					const key = path.join(p.dir, p.name);

					if (!assets.has(key)) {
						assets.set(key, []);
					}

					assets.get(key).push(f);
				}

				if (this._canceled) {
					return;
				}

				this._env.logger.debug({assets: assets.size}, "Queueing assets for sync");

				if (!assets.size) {
					return;
				}

				for (let [key, value] of assets) {
					if (this._canceled) {
						return;
					}

					if (value.length) {
						// converting to Set to get around queue limitation
						// which sees an array as multiple `push`es
						queue.push(new Set(value));
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
	if (assets.size === 0) {
		return Promise.reject(new Error("Assets must be a Set"));
	}

	const {Moment, Asset, Instance} = env.db;

	return (async () => {
		for (let a of assets) {
			let assetDir = searchPath;
			let assetFile = a;
			let assetPath = path.join(assetDir, assetFile);

			env.logger.debug({assetPath}, "Syncing asset");

			// if the asset is moved or organized, these targets will be adjusted
			let newAssetDir = assetDir;
			let newAssetFile = assetFile;
			let newAssetPath = assetPath;

			const [tags, {Orientation}, stats] = await Promise.all([
				exiftool.read(assetPath),
				exiftool.read(assetPath, ["-Orientation#"]),
				fse.stat(assetPath)
			]);
			if (!tags) {
				env.logger.error("Could not read EXIF");
				continue;
			} else if (tags.Error) {
				env.logger.error("EXIF read failed: " + tags.Error);
				continue;
			}

			const hash = await sha512(assetPath);

			let date = tags.GPSDateTime ||
				tags.SubSecDateTimeOriginal ||
				tags.DateTimeOriginal ||
				tags.CreationDate ||
				tags.CreateDate ||
				tags.MediaCreateDate;

			if (date) {
				date = date.toString();
			} else {
				env.logger.warn({assetPath}, "No Born date was found in asset EXIF");

				date = Asset.fileNameToDate(path.parse(assetPath).name);
				if (!date) {
					env.logger.warn({assetPath}, "No date could be found in the filename");

					date = stats.birthtime;
					env.logger.warn({assetPath, date}, "Using file changed date");
				} else {
					env.logger.warn({assetPath, date}, "Using date from filename");
				}
			}

			const values = {
				hash,
				type: tags.MIMEType.substr(0, 5), // FIXME
				format: tags.FileType,
				width: tags.ImageWidth,
				height: tags.ImageHeight,
				orientation: Orientation || 1,
				exif: tags,
				bornAt: momentjs(date)

			};

			env.logger.warn({date}, "DATE");

			let [asset, created] = await Asset.findOrCreate({
				where: {
					hash
				},
				defaults: values,
				env
			});
			// FIXME: remove after debugging travis failure
			delete asset.exif;
			if (created) {
				env.logger.debug({asset}, "Created asset");
			} else {
				await asset.update(values);
				env.logger.debug({asset}, "Updated asset");
			}

			if (options.move) {
				newAssetDir = options.move;
			}
			if (options.organize) {
				newAssetFile = asset.canonicalPath();
			}
			newAssetPath = path.join(newAssetDir, newAssetFile);
			env.logger.debug({assetPath, newAssetPath}, "Asset organization target");

			// FIXME: wrap in a transaction so sync can be paralelized
			let instances = await asset.getInstances();
			let instance = instances.find(i => (
				i.path === assetFile ||
				i.path === newAssetFile ||
				i.original === assetFile ||
				i.original === newAssetFile));
			if (!instance) {
				// FIXME: try to update an orphaned db entry before creating one
				instance = await Instance.create({
					assetId: asset.id,
					path: assetFile,
					original: assetFile
				});
			}
			if (assetPath !== newAssetPath) {
				await fse.copy(assetPath, newAssetPath);
				instance.path = newAssetFile;
				await instance.save();
				await fse.remove(assetPath);
			}

		}
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
