'use strict';

const test = require('tape');

const { createSourceError } = require('../../lib/utils');

test(`utils.createSourceError - points to the line`, t => {
  const data = `\nJim\nBob\nDan\n`;

  const expected =
`[Source]:
> 1 |\u0020
  2 | Jim
  3 | Bob
  4 | Dan\n`;

  const err = createSourceError({
    name: 'ParserError',
    line: 1,
    source: data
  });

  const actual = err.message;

  t.equal(actual, expected, 'line 1');
  t.end();
});

test(`utils.createSourceError - no source message if line is not passed`, t => {
  const data = '';
  const expected = `That'll be the day`;

  const err = createSourceError({
    name: 'ParserError',
    message: expected,
    source: data
  });

  const actual = err.message;

  t.equal(actual, expected, 'no line');
  t.end();
});

test(`utils.createSourceError - single line source`, t => {
  const data = `Jim`;

  const expected =
`[Source]: That'll be the day
> 1 | Jim\n`;

  const err = createSourceError({
    name: 'ParserError',
    message: `That'll be the day`,
    line: 1,
    source: data
  });

  const actual = err.message;

  t.equal(actual, expected, 'negative line');
  t.end();
});

test(`utils.createSourceError - single line source with negative line`, t => {
  const data = `Jim`;

  const expected =
`[Source]: That'll be the day
> 1 | Jim\n`;

  const err = createSourceError({
    name: 'ParserError',
    message: `That'll be the day`,
    line: -1,
    source: data
  });

  const actual = err.message;

  t.equal(actual, expected, 'negative line');
  t.end();
});

test(`utils.createSourceError - minimum line number is enforced`, t => {
  const data = `\nJim\nBob\nDan\n`;

  const expected =
`[Source]: That'll be the day
> 1 |\u0020
  2 | Jim
  3 | Bob
  4 | Dan\n`;

  const err = createSourceError({
    name: 'ParserError',
    message: `That'll be the day`,
    line: -1,
    source: data
  });

  const actual = err.message;

  t.equal(actual, expected, 'negative line');
  t.end();
});

test(`utils.createSourceError - maximum line number is enforced`, t => {
  const data = `\nJim\nBob\nDan\n`;

  const expected =
`[Source]: That'll be the day
  2 | Jim
  3 | Bob
  4 | Dan
> 5 | \n`;

  const err = createSourceError({
    name: 'ParserError',
    message: `That'll be the day`,
    line: 100,
    source: data
  });

  const actual = err.message;

  t.equal(actual, expected, 'negative line');
  t.end();
});

test(`utils.createSourceError - maximum line number is enforced with single line source`, t => {
  const data = `Jim`;

  const expected =
`[Source]: That'll be the day
> 1 | Jim\n`;

  const err = createSourceError({
    name: 'ParserError',
    message: `That'll be the day`,
    line: 100,
    source: data
  });

  const actual = err.message;
  t.equal(actual, expected, 'negative line');
  t.end();
});

test(`utils.createSourceError - shows filename when passed`, t => {
  const data = `\nJim\nBob\nDan\n`;

  const expected =
`amigos.txt: That'll be the day
> 1 |\u0020
  2 | Jim
  3 | Bob
  4 | Dan\n`;

  const err = createSourceError({
    name: 'ParserError',
    message: `That'll be the day`,
    filename: 'amigos.txt',
    line: 1,
    source: data
  });

  const actual = err.message;

  t.equal(actual, expected, 'shows filename');
  t.end();
});
