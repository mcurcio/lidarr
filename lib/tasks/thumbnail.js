'use strict';

const BaseTask = require('../base');

module.exports = class ThumbnailTask extends BaseTask {
	constructor(thumbnailDir, db) {
		super();

		this._thumbnailDir = thumbnailDir;
		this._db = db;
	}

	_start() {
		_onDidFinish();
	}
};
