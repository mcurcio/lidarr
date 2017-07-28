'use strict';

const BaseTask = require('./base');

const async = require('async');
const fse = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

module.exports = class ThumbnailTask extends BaseTask {
	constructor(env) {
		super();

		this._env = env;
	}

	_start() {
		const queue = async.queue((photo, cb) => {
			const {Photo, Thumbnail} = this._env.db;

			(async () => {
				const thumbs = await photo.getThumbnails();

				const existing = [].concat(...thumbs.map(t => [t.width, t.height]));
				const missing = Thumbnail.sizes.filter(s => !existing.includes(s));

				this._env.logger.trace({missing}, "Missing thumbnails");

				const locations = await photo.getLocations();
				if (!locations.length) {
					this._env.logger.warn({photo}, "Could not generate thumbnail for missing photo");
					throw new Error("No photo on disk for thumbnail");
				}

				const s = sharp(path.join(this._env.config.paths.library, locations[0].path));
				let promises = missing.map(async (size) => {
					this._env.logger.trace({photo, size}, "Making thumbnail");

					const thumbnail = Thumbnail.build({
						photoId: photo.id,
						ext: path.parse(photo.locations[0].path).ext.substr(1),
					});

					let tPath = path.join(this._env.config.paths.thumbs, thumbnail.path());
					await fse.ensureDir(path.parse(tPath).dir);

					let i = await s.resize(size, size).min()
						.toFile(tPath);
					thumbnail.width = i.width;
					thumbnail.height = i.height;

					this._env.logger.trace({size, thumbnail}, "Generated thumbnail");

					await thumbnail.save();
				});
				return Promise.all(promises);
			})()
			.catch(err => this._env.logger.error({err}, "Thumbnail error"))
			.then(cb);
		}, 5);

		return (async () => {
			const {Photo, Location, Thumbnail, sequelize} = this._env.db;

			let photos = await Photo.findAll({
				include: [
					Location,
					{
						model: Thumbnail,
//						where: {
//							width: { $notIn: Thumbnail.sizes },
//							height: { $notIn: Thumbnail.sizes }
//						}
					}
				],
				//logging: console.log
			});
			this._env.logger.info(photos.length + " photos might need thumbnails");

			if (photos.length === 0) {
				return;
			}

			for (let p of photos) {
				queue.push(p);
			}

			let resolve;
			let promise = new Promise(resolve_ => {
				resolve = resolve_;
			});
			queue.drain = resolve;
			return promise;
		})().catch(e => { console.log(e); this._env.logger.error({error:e}, "Thumbnail task failed"); });
	}
};
