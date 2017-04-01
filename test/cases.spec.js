'use strict';

const path = require('path');

const compare = require('./compare');

const Parser = require('../lib/parser');
const Lexer = require('../lib/lexer');

function createLexerTransform(title, _Lexer, opts) {
  return {
    title,
    data({ data, header }) {
      const options = Object.assign({}, opts, header.options);

      return _Lexer.all(data, options);
    },
    comparator({ comparator, header }) {
      const options = Object.assign({}, opts, header.options);

      return JSON.parse(comparator, options);
    },
  };
}

const lexopts = [
  { options: { throwSourceError: false } },
];

lexopts.forEach(({ options: opts }) => {
  const lexerTransforms = [
    createLexerTransform('Lexer - ', Lexer, opts),
  ];

  lexerTransforms.forEach(transform => {
    compare(path.join(__dirname, './cases/lexer/**/*'), {
      prefix: transform.title,
      transform,
    });
  });
});

function createParserTransform(title, _Parser, opts) {
  return {
    title,
    data: ({ data, header }) => {
      const options = Object.assign({}, opts, header.options);

      return _Parser.parse(data, options).body;
    },
    comparator({ comparator }) {
      return JSON.parse(comparator);
    },
  };
}

const parseropts = [
  { options: { throwSourceError: false } },
];

parseropts.forEach(({ options: opts }) => {
  const parserTransforms = [
    createParserTransform('Parser - ', Parser, opts),
  ];

  parserTransforms.forEach(transform => {
    compare(path.join(__dirname, './cases/parser/**/*'), {
      prefix: transform.title,
      transform,
    });
  });
});
