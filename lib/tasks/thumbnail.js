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
				console.error("No locations available");
				return cb();
			}

			for (let dim of this._env.db.Thumbnail.sizes) {
				let thumb = photo.thumbnails.find((t) => t.min === dim);
				if (!thumb) {
					if (!s) {
						s = sharp(path.join(this._env.config.paths.library, photo.locations[0].path));
					}

					let p = (async () => {
						let thumbnail = new this._env.db.Thumbnail;
						thumbnail.photoId = photo.id;
						thumbnail.ext = path.parse(photo.locations[0].path).ext.substr(1);

						let tPath = path.join(this._env.config.paths.thumbs, thumbnail.path());
						await fse.ensureDir(path.parse(tPath).dir);

						await s.resize(dim, dim).min()
							.toFile(tPath);

						await thumbnail.save();
					})();

					promises.push(p);
				}
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
		})().catch(e => console.error("Thumbnail task error", e));
	}
};
