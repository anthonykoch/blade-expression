'use strict';

const test = require('tape');

const Token = require('../../lib/constants/tokens');
const Parser = require('../../lib/parser');

test('Parser.parse', t => {
  const actual = Parser.parse('id');

  t.equals(actual.type, 'Program');
  t.throws(() => Parser.parse(), /./, 'parse throws without passing a string');
  t.end();
});

test('Parser - returns an as', t => {
  t.equals(typeof new Parser(`'Hello'`), 'object');
  t.end();
});

test('parser.parse', t => {
  const data = 'Hello';
  const parser = new Parser(data);
  const ast = parser.parse();

  t.equals(ast.type, 'Program', 'returns an ast');
  t.end();
});

test('parser.nextToken', t => {
  const data = 'user';
  const parser = new Parser(data);
  const token = {
    type: Token.Identifier,
    value: data,
    line: 1,
    column: 0,
    start: 0,
    end: 4,
  };

  t.deepEquals(parser.nextToken(), token);
  t.end();
});

test('parser.peek', t => {
  const data = 'user';
  const parser = new Parser(data);

  const token = {
    type: Token.Identifier,
    value: data,
    line: 1,
    column: 0,
    start: 0,
    end: 4,
  };

  t.deepEquals(parser.peek(), token);
  t.end();
});

test('parser.ensure', t => {
  const data = `'Hello ' + user.name + 'my name is ' + name`;
  const parser = new Parser(data);

  t.deepEquals(parser.ensure(3), {
    type: Token.Identifier,
    value: 'user',
    line: 1,
    column: 11,
    start: 11,
    end: 15,
  });

  t.doesNotThrow(() => parser.ensure(9));
  t.throws(() => parser.ensure(10));

  t.end();
});

test('parser.expect', t => {
  const data = `'Hello ' + user.name + 'my name is ' + name`;
  const parser = new Parser(data);

  parser.nextToken();
  parser.nextToken();

  t.deepEquals(parser.expect('user'), {
    type: Token.Identifier,
    value: 'user',
    line: 1,
    column: 11,
    start: 11,
    end: 15,
  }, 'expect identifier');

  t.throws(() => parser.expect('user'), /Unexpected token "\."/, 'expect throws if token does not have the value');

  t.end();
});

test('parser.peek', t => {
  const data = 'user.name';
  const parser = new Parser(data);

  t.deepEquals(parser.peek().value, 'user', 'peek returns next token');

  t.deepEquals(parser.peek().value, 'user', 'peek does not consume token');

  t.doesNotThrow(() => {
    for (let i = 0; i < 20; i++) {
      parser.peek();
      parser.nextToken();
    }
  }, 'peek never throws');

  t.end();
});

test('parser.match', t => {
  const data = 'user.name';
  const parser = new Parser(data);

  t.ok(parser.match('user'), 'matches identifier');

  parser.nextToken();
  t.ok(parser.match('.'), 'matches identifier');

  t.notOk(parser.match('user'));

  t.end();
});

test('parser.source', t => {
  const data = 'user.name';
  const parser = new Parser(data);

  t.ok(parser.source === parser.lexer.source);
  t.ok(data === parser.lexer.source);

  t.end();
});

test('parser.allowDelimited parses expressions with semicolons betwixt', t => {
  const parser = new Parser('user.name;123', { allowDelimited: true });
  const first = parser.parse();

  t.ok(parser.hasMore, 'has more');

  const last = parser.parse();

  t.equals(first.body[0].expression.object.name, 'user');
  t.equals(last.body[0].expression.value, '123');
  t.notOk(parser.hasMore, 'has no more');

  t.end();
});

test('parser.consumeLeast', t => {
  const parser = new Parser('user.name 123', { consumeLeast: true });
  const first = parser.parse();

  t.ok(parser.hasMore, 'has more');

  const last = parser.parse();

  t.equals(first.body[0].expression.object.name, 'user', 'identifier');
  t.equals(last.body[0].expression.value, '123', 'number');
  t.notOk(parser.hasMore, 'has no more');

  t.end();
});

test('parser - newlines between', t => {
  const parser = new Parser('user.name\n123');
  const first = parser.parse();

  t.ok(parser.hasMore, 'has more');

  const last = parser.parse();

  t.equals(first.body[0].expression.object.name, 'user', 'identifier');
  t.equals(last.body[0].expression.value, '123', 'number');
  t.notOk(parser.hasMore, 'has no more');

  t.end();
});
