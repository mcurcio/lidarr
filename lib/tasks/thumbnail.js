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
			let promises = [];
			let s;

			if (!photo.locations.length) {
				this._env.logger({photo}, "Could not generate thumbnail for missing photo");
				return cb();
			}

			for (let dim of this._env.db.Thumbnail.sizes) {
				let p = (async () => {
					let thumbs = await photo.getThumbnails();
					let thumb = thumbs.find((t) => {
						return t.min() === dim;
					});

					if (thumb) {
						this._env.logger.trace({photo, thumb}, "Already have thumbnail for photo");
					} else {
						this._env.logger.trace({photo, thumb:dim}, "Making thumbnail");

						if (!s) {
							s = sharp(path.join(this._env.config.paths.library, photo.locations[0].path));
						}

						let thumbnail = new this._env.db.Thumbnail;
						thumbnail.photoId = photo.id;
						thumbnail.ext = path.parse(photo.locations[0].path).ext.substr(1);

						let tPath = path.join(this._env.config.paths.thumbs, thumbnail.path());
						await fse.ensureDir(path.parse(tPath).dir);

						let i = await s.resize(dim, dim).min()
							.toFile(tPath);
						thumbnail.width = i.width;
						thumbnail.height = i.height;

						await thumbnail.save();
					}
				})();

				promises.push(p);
			}

			Promise.all(promises).then(cb, e => console.error("thumbnail error", e));
		}, 10);

		return (async () => {
			let photos = await this._env.db.Photo.findAll({
				include: [this._env.db.Location, this._env.db.Thumbnail],
				where: {

				},
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
		})().catch(e => this._env.logger.error({e}, "Thumbnail task failed"));
	}
};
