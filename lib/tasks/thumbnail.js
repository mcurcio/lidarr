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
		const queue = async.queue((asset, cb) => {
			const {Asset, Thumbnail} = this._env.db;

			(async () => {
				const thumbs = await asset.getThumbnails();

				const existing = [].concat(...thumbs.map(t => [t.width, t.height]));
				const missing = Thumbnail.sizes.filter(s => !existing.includes(s));

				this._env.logger.trace({missing}, "Missing thumbnails");

				const instances = await asset.getInstances();
				if (!instances.length) {
					this._env.logger.warn({asset}, "Could not generate thumbnail for missing asset");
					throw new Error("No asset on disk for thumbnail");
				}

				const s = sharp(path.join(this._env.config.paths.library, instances[0].path));

				let promises = missing.map(async (size) => {
					this._env.logger.debug({asset, size}, "Making thumbnail");

					const thumbnail = Thumbnail.build({
						assetId: asset.id,
						format: asset.format//path.parse(instances[0].path).ext.substr(1),
					});

					let tPath = path.join(this._env.config.paths.thumbs, thumbnail.path());
					await fse.ensureDir(path.parse(tPath).dir);

					let i = await s.rotate()
						.resize(size, size).min()
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
		}, 1);
		this._queue = queue;

		return (async () => {
			const {Asset, Instance, Thumbnail, sequelize} = this._env.db;

			let assets = await Asset.findAll({
				attributes: ['id'],
				include: [
					{
						model: Thumbnail,
						attributes: ['id', 'size'],
						where: {
							size: { $in: Thumbnail.sizes }
						}
					}
				]
			});
			this._env.logger.debug({count:assets.length}, "Assets have at least one thumbnail");

			let ids = assets.reduce((array, asset) => {
				if (asset.thumbnails.length == Thumbnail.sizes.length) {
					array.push(asset.id);
				}
				return array;
			}, []);

			this._env.logger.debug({count:ids.length, thumbnails:Thumbnail.sizes.length}, 'Assets already having complete thumbnails');

			assets = await Asset.findAll({
				include: [Instance, Thumbnail],
				where: {
					id: { $notIn: ids }
				}
			});

			this._env.logger.debug({count:assets.length}, 'Assets requiring at least one thumbnail');

			if (assets.length === 0) {
				return;
			}

			for (let p of assets) {
				queue.push(p);
			}

			let resolve;
			let promise = new Promise(resolve_ => {
				resolve = () => {
					this._env.logger.debug("Thumbnail task queue drain");
					resolve_();
				};
			});
			queue.drain = resolve;
			return promise;
		})().catch(err => this._env.logger.error({err}, "Thumbnail task failed"));
	}

	_cancel() {
		this._env.logger.debug("Canceling thumbnail task");

		if (this._queue) {
			let count = 0;
			this._queue.remove(fn => {
				++count;
				return true;
			});
			this._env.logger.debug({count}, "Cleared thumbnail queue");
		}
	}
};
