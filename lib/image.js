'use strict';

const fs = require('fs');
const im = require('imagemagick-native');

const readFile = path => {
	return new Promise((resolve, reject) => {
		fs.readFile(path, (err, data) => {
			if (err) return reject(err);

			resolve(data);
		});
	});
};

exports.identify = path => {
	return readFile(path).then((data) => {
		return new Promise((resolve, reject) => {
			im.identify({
				srcData: data
			}, (err, data) => {
				if (err) return reject(err);

				resolve(data);
			});
		});
	});
};
