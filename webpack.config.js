'use strict';

const webpack = require('webpack');
const path    = require('path');

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
    filename: 'bladeexp.js',
    libraryTarget: 'umd',
    library: 'Bladexp'
  },
  module:
  {
    noParse: [],
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ],
  },
  plugins: [
    new webpack.optimize.DedupePlugin(),
  ],
};
