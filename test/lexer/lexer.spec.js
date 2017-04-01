'use strict';

const test = require('tape');

const Lexer = require('../../lib/lexer');

test('Lexer - reduces input when using non-sticky regex', t => {
  const data = 'name + greeting';
  const lexer = Lexer.create(data);

  lexer.nextToken();
  t.notEqual(lexer.input, data);
  t.end();
});

test('Lexer - strips BOM', t => {
  t.equals(Lexer.create('\uFEFFhello').input, 'hello');
  t.notEquals(
      Lexer.create('hello\uFEFF'),
      'hello\uFEFF',
      'does not remove BOM '
    );
  t.end();
});

test('Lexer.create - returns an object', t => {
  const data = 'name + greeting';
  const lexer = Lexer.create(data);

  t.ok(lexer);
  t.equal(typeof lexer, 'object');
  t.throws(() => Lexer.create(), /of undefined/);
  t.end();
});

test('lexer.nextToken', t => {
  const data = 'name + greeting';
  const lexer = Lexer.create(data);

  t.equals(lexer.nextToken().value, 'name',     'returns first token');
  t.equals(lexer.nextToken().value, '+',        'returns second token');
  t.equals(lexer.nextToken().value, 'greeting', 'returns third token');
  t.equals(lexer.nextToken(),        null,      'end of tokens');

  t.end();
});

test('lexer.skipWhitespace', t => {
  const data = '     name     +     greeting     ';
  const lexer = Lexer.create(data);

  lexer.skipWhitespace();
  t.equals(lexer.position, 5, 'skips whitespace');
  t.end();
});

test('lexer.lookahead', t => {
  const data = '     name     +     greeting     ';
  const lexer = Lexer.create(data);

  t.equal(lexer.lookahead(3).value, 'greeting', 'lookahead token');
  t.equal(lexer.lookahead(4), null, 'null token');

  t.equals(lexer.stash[0].value, 'name',     'first token');
  t.equals(lexer.stash[1].value, '+',        'second token');
  t.equals(lexer.stash[2].value, 'greeting', 'third token');

  t.throws(() => lexer.lookahead(-1), /Lookahead index must be more than 0/);
  t.throws(() => lexer.lookahead(0), /Lookahead index must be more than 0/);

  t.equals(
    Lexer.create('apple juice').lookahead(1).value,
    'apple',
    'first lookahead returns first token');

  t.end();
});

test('lexer.peek', t => {
  const data = '     name     +     greeting     ';
  const lexer = Lexer.create(data);

  t.equal(lexer.peek().value, 'name', 'peek token');

  lexer.nextToken();
  t.equal(lexer.peek().value, '+', 'peek token');

  lexer.nextToken();
  t.equal(lexer.peek().value, 'greeting', 'peek token');

  lexer.nextToken();
  t.equal(lexer.peek(), null, 'null token');

  t.end();
});

test('lexer.peek', t => {
  const data = '     name     +     greeting     ';
  const lexer = Lexer.create(data);

  t.throws(() => lexer.error('Ya dun'), /Ya dun/, 'lexer throws');
  t.end();
});

test('Lexer - StringLiteral - line endings in string literals error', t => {
  // This can't be done with error cases because text editors transform line endings
  const options = { throwSourceError: false };
  const error = /Unexpected token """ \(1:0\)/;

  t.throws(() => Lexer.all('"\n"', options), error);
  t.throws(() => Lexer.all('"\r"', options), error);
  t.throws(() => Lexer.all('"\r\n"', options), error);
  t.end();
});
