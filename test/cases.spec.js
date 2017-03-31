'use strict';

const fs = require('fs');
const path = require('path');

const acorn = require('acorn');

const compare = require('./compare');
only: true

const Parser = require('../lib/parser');
const DistParser = require('../dist/bladeexp.js');
const DistMinParser = require('../dist/bladeexp.min.js');

const Lexer = require('../lib/lexer');
const DistLexer = require('../dist/bladeexp.js').Lexer;
const DistMinLexer = require('../dist/bladeexp.min.js').Lexer;

// Lexer transforms

function createLexerTransform(title, _Lexer, opts) {
  return {
    title,
    data({ data, header }) {
      const options = Object.assign({}, opts, header.options);
      return _Lexer.all(data, options)
    },
    comparator({ comparator, header }) {
      const options = Object.assign({}, opts, header.options);
      return JSON.parse(comparator, options);
    }
  }
}

const lexopts = [
  {
    options: { throwSourceError: false }
  }
];

lexopts.map(({ options: opts }) => {
  const lexerTransforms = [
    createLexerTransform('Lexer - ', Lexer, opts),
    // createLexerTransform('DistLexer - ', DistLexer, opts),
    // createLexerTransform('DistMinLexer - ', DistMinLexer, opts),
  ];

  lexerTransforms.map(transform => {
    compare(path.join(__dirname, './cases/lexer/**/*'), {
      prefix: transform.title,
      transform
    });
  });
});

function createParserTransform(title, _Parser, opts, header) {
  return {
    title,
    data: ({ data, header }) => {
      const options = Object.assign({}, opts, header.options);
      return _Parser.parse(data, options).body
    },
    comparator({ comparator, header }) {
      const options = Object.assign({}, opts, header.options);
      return JSON.parse(comparator);
    }
  }
}

const parseropts = [
  {
    options: {
      throwSourceError: false
    }
  }
];

parseropts.map(({ options: opts }) => {
  const parserTransforms = [
    createParserTransform('Parser - ', Parser, opts),
    // createParserTransform('DistParser - ', DistParser, opts),
    // createParserTransform('DistMinParser - ', DistMinParser, opts),
  ];

  parserTransforms.map(transform => {
    compare(path.join(__dirname, './cases/parser/**/*'), {
      prefix: transform.title,
      transform
    });
  });
});
