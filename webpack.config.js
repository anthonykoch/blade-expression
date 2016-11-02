'use strict';

const webpack = require('webpack');
const path    = require('path');

var vendors = {
	'pad-start':     'pad-start',
	'object-assign': 'object-assign',
	'repeat-string': 'repeat-string'
};

const config = module.exports = {
	entry: {
		'app': './lib/index.js',
	},
	resolve: {
		alias: {}
	},
	output:
	{
		path: './dist',
		filename: 'blade-expression.js',
		libraryTarget: 'umd',
	},
	module:
	{
		noParse: [],
		loaders: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: "babel-loader"
			}
		],
	},
	plugins: [
		new webpack.optimize.DedupePlugin(),
	],
};

for (var name in vendors) {
	var file = vendors[name];
	config.resolve.alias[name] = file;
	config.module.noParse.push(new RegExp('^' + name + '$'));
}
