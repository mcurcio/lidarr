'use strict';

const BaseTask = require('./base');

const async = require('async');
const fse = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

module.exports = class ThumbnailTask extends BaseTask {
	constructor(libraryDir, thumbnailDir, db) {
		super();

		this._libraryDir = libraryDir;
		this._thumbnailDir = thumbnailDir;
		this._db = db;
	}

	_start() {
		const queue = async.queue((photo, cb) => {
			let promises = [];
			let s;

			if (!photo.locations.length) {
				console.error("No locations available");
				return cb();
			}

			for (let dim of this._db.Thumbnail.sizes) {
				let thumb = photo.thumbnails.find((t) => t.min === dim);
				if (!thumb) {
					if (!s) {
						s = sharp(path.join(this._libraryDir, photo.locations[0].path));
					}

					let p = (async () => {
						let thumbnail = new this._db.Thumbnail;
						thumbnail.photoId = photo.id;
						thumbnail.ext = path.parse(photo.locations[0].path).ext.substr(1);

						let tPath = path.join(this._thumbnailDir, thumbnail.path());
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
			let photos = await this._db.Photo.findAll({
				include: [this._db.Location, this._db.Thumbnail],
				where: {

				},
				//logging: console.log
			});

			if (photos.length === 0) {
				this._onDidFinish();
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
