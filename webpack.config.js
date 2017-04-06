'use strict';

const path    = require('path');

module.exports = {
  entry: {
    lexer:   './lib/lexer.js',
    walk:    './lib/walk.js',
    jsparse: './lib/parser.js',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [
          { loader: 'babel-loader' },
        ],
      },
    ],
  },
};
