'use strict';

const childProcess = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

class RelayCompilerPlugin {
	apply(compiler) {
		compiler.plugin('before-compile', (compiler, callback) => {
				const r = path.join(path.resolve(__dirname), "node_modules", "relay-compiler", "bin", "relay-compiler");
				childProcess.exec(`${r} --src src/ --schema ./schema.json`, callback);
		});
	}
};

module.exports = {
	devtool: "source-map",
	entry: {
		app: ["./src/index.js"]
	},
	output: {
		path: path.resolve(__dirname, "build"),
		filename: "bundle.js"
	},
	module: {
		loaders: [
			{ test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
			{
				test: /\.css$/,
				loader: ExtractTextPlugin.extract("css-loader")
			}
		]
	},
	plugins: [
		new ExtractTextPlugin("/css/style.css"),
		new RelayCompilerPlugin(),
//		new webpack.optimize.UglifyJsPlugin(),
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "./public/index.html")
		})
	]
};
