'use strict';

const path = require('path');

module.exports = {
	entry: {
		app: ["./public/js/index.js"]
	},
	output: {
		path: path.resolve(__dirname, "build"),
		publicPath: "./public/path",
		filename: "bundle.js"
	}
};
