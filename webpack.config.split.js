'use strict';

/**
 * This one is just to see how much the actual lib and
 * dependencies weigh in at independently.
 */

const webpack = require('webpack');
const path    = require('path');

var vendors = {
	'pad-start': 'pad-start',
	'object-assign': 'object-assign',
	'repeat-string': 'repeat-string'
};

const config = module.exports = {
	entry: {
		'app': './lib/index.js',
		'vendor.js': []
	},
	resolve: {
		alias: {}
	},
	output:
	{
		path: './build',
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
		new webpack.optimize.CommonsChunkPlugin('vendor.js', 'vendor.js'),
	],
};

for (var name in vendors) {
	var file = vendors[name];
	config.resolve.alias[name] = file;
	config.module.noParse.push(new RegExp('^' + name + '$'));
	config.entry['vendor.js'].push(name);
}
