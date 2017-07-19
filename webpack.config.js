'use strict';

const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	devtool: "source-map",
	entry: {
		app: ["./src/App.js"]
	},
	output: {
		path: path.resolve(__dirname, "build"),
		filename: "bundle.js"
	},
	module: {
		loaders: [
			{ test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "./public/index.html")
		})
	]
};
