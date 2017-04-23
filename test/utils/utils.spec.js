'use strict';

const test = require('tape');

const { cook, hexValue } = require('../../lib/utils');

test('awd', t => {
  t.equals(cook('\\u0020'),     ' ',  'unicode escape space');
  t.equals(cook('\\u{20}'),     ' ',  'code point escape space');
  t.equals(cook('\\u{0020}'),   ' ',  'leading zero code point escape - space');
  t.equals(cook('\\x20'),       ' ',  'hex escape - space');
  t.equals(cook(`\\'`),         `'`,  'quote');
  t.equals(cook('"'),           '"',  'quote');
  t.equals(cook('\\\\'),        '\\', '\\\\');
  t.equals(cook('\b'),          '\b', '\\b');
  t.equals(cook('\f'),          '\f', '\\f');
  t.equals(cook('\n'),          '\n', '\\n');
  t.equals(cook('\r'),          '\r', '\\r');
  t.equals(cook('\t'),          '\t', '\\t');
  t.equals(cook('\v'),          '\v', '\\v');
  t.equals(cook('\\{'),         '{',  'brace');
  t.equals(cook('\\a'),         'a',  'char "a"');
  t.equals(cook('\\u{1f4ac}'),  '💬',  'comment character')
  t.equals(cook('\\u{10FFFF}'), '􏿿', 'max uncode escape char');
  t.throws(() => cook('\\x'),          /Invalid hex escape sequence/);
  t.throws(() => cook('\\x2'),         /Invalid hex escape sequence/);
  t.throws(() => cook('\\xg'),         /Invalid hex escape sequence/);
  t.throws(() => cook('\\u'),          /Invalid unicode escape sequence/);
  t.throws(() => cook('\\u0'),         /Invalid unicode escape sequence/);
  t.throws(() => cook('\\u01'),        /Invalid unicode escape sequence/);
  t.throws(() => cook('\\u012'),       /Invalid unicode escape sequence/);
  t.throws(() => cook('\\u012g'),      /Invalid unicode escape sequence/);
  t.throws(() => cook('\\u{}'),        /Invalid unicode escape sequence/);
  t.throws(() => cook('\\u{'),         /Invalid unicode escape sequence/);
  t.throws(() => cook('\\u{feff'),     /Invalid unicode escape sequence/);
  t.throws(() => cook('\\u{g}'),       /Invalid unicode escape sequence/);
  t.throws(() => cook('\\u{ag}'),      /Invalid unicode escape sequence/);
  t.throws(() => cook('\\u{1g}'),      /Invalid unicode escape sequence/);
  t.throws(() => cook('\\u{110FFFF}'), /Invalid unicode code-point/);
  t.end();
});
