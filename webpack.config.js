'use strict';

const path    = require('path');

module.exports = {
  entry: {
    'Lexer':  './lib/lexer.js',
    'Walk':   './lib/walk.js',
    'JSExpr': './lib/parser.js',
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
