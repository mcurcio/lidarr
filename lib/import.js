'use strict';

const path = require('path');
const Transform = require('stream').Transform;

const fse = require('fs-extra');
const klaw = require('klaw');

class Importer extends Transform {
	constructor(srcPath, destPath, db) {
		super({ objectMode: true });

		this._srcPath = srcPath;
		this._destPath = destPath;
		this._db = db;
	}

	_transform(obj, encoding, cb) {
		if (obj.stats.isDirectory()) {
			console.log('skipping directory', obj.path);
			return cb();
		}

		let file = obj.path;
		let subPath = file.substr(this._srcPath.length+1);
		let parts = subPath.split(path.sep);
		let newPath = path.join.apply(null, [this._destPath].concat(parts));
		console.log('got', subPath, parts, newPath);
		fse.copy(obj.path, newPath).then(() => {
			console.log('done copying');
			cb();
		}, () => {
			console.log('failed copy');
			cb();
		});
	}
};

function import_(searchPath, destPath, db) {
	return new Promise((resolve, reject) => {
		klaw(searchPath)
			.pipe(new Importer(searchPath, destPath, db))
			.on('data', () => {})
			.on('error', function (err, item) {
				reject(err);
			})
			.on('end', function () {
				console.log('end');
				resolve();
			});
	});
}
module.exports = import_;
