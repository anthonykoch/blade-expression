'use strict';

const test = require('tape');

const { Parser } = require('../utils');
const { TokenIdentifier } = require('../../lib/constants/tokens');

test('Parser.parse', (assert) => {
    const actual = Parser.parse('id');
    assert.equals(actual.type, 'Program');
    assert.throws(() => Parser.parse(), /./, 'parse throws without passing a string');
    assert.end();
});

test('Parser.create', (assert) => {
    const parser = Parser.create(`'Hello'`);
    assert.equals(typeof parser, 'object');
    assert.throws(() => Parser.create(), /of undefined/, 'create throws without passing a string');
    assert.end();
});

test('parser.parse', (assert) => {
    const data = `'Hello'`;
    const parser = Parser.create(data);
    const ast = {
        type: 'Program',
        body: [
            {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Literal',
                    value: `'Hello'`,
                    start: 0,
                    end: 7,
                }
            }
        ]
    };

    assert.equals(typeof parser, 'object');
    assert.deepEquals(parser.parse(), ast, 'returns an ast');
    assert.end();
});

test('parser.nextToken', (assert) => {
    const data = `user`;
    const parser = Parser.create(data);

    const token = {
        type: TokenIdentifier,
        value: data,
        line: 1,
        column: 4,
        start: 0,
        end: 4,
    };

    assert.deepEquals(parser.nextToken(), token);
    assert.end();
});

test('parser.peek', (assert) => {
    const data = `user`;
    const parser = Parser.create(data);

    const token = {
        type: TokenIdentifier,
        value: data,
        line: 1,
        column: 4,
        start: 0,
        end: 4,
    };

    assert.deepEquals(parser.peek(), token);
    assert.end();
});

test('parser.ensure', (assert) => {
    const data = `'Hello ' + user.name + 'my name is ' + name`;
    const parser = Parser.create(data);

    assert.deepEquals(parser.ensure(3), {
        type: TokenIdentifier,
        value: 'user',
        line: 1,
        column: 15,
        start: 11,
        end: 15
    });

    assert.doesNotThrow(() => parser.ensure(9));
    assert.throws(() => parser.ensure(10));

    assert.end();
});

test('parser.expect', (assert) => {
    const data = `'Hello ' + user.name + 'my name is ' + name`;
    const parser = Parser.create(data);

    parser.nextToken();
    parser.nextToken();

    assert.deepEquals(parser.expect('user'), {
        type: TokenIdentifier,
        value: 'user',
        line: 1,
        column: 15,
        start: 11,
        end: 15
    }, 'expect identifier');

    assert.throws(() => parser.expect('user'), /Unexpected token \./, 'expect throws if token does not have the value');

    assert.end();
});

test('parser.peek', (assert) => {
    const data = `user.name`;
    const parser = Parser.create(data);

    assert.deepEquals(parser.peek().value, 'user', 'peek returns next token');

    assert.deepEquals(parser.peek().value, 'user', 'peek does not consume token');

    assert.doesNotThrow(() => {
        for (let i = 0; i < 20; i++) {
            parser.peek();
            parser.nextToken();
        }
    }, 'peek never throws');

    assert.end();
});

test('parser.match', (assert) => {
    const data = `user.name`;
    const parser = Parser.create(data);

    assert.ok(parser.match('user'), 'matches identifier');

    parser.nextToken();
    assert.ok(parser.match('.'), 'matches identifier');

    assert.notOk(parser.match('user'));

    assert.end();
});

test('parser.matches', (assert) => {
    const data = `user.name`;
    const parser = Parser.create(data);

    assert.ok(parser.matches('user', '.'));
    assert.notOk(parser.matches('user.'));

    parser.nextToken();
    assert.ok(parser.matches('.', 'name'));

    assert.end();
});

test('parser.source', (assert) => {
    const data = `user.name`;
    const parser = Parser.create(data);

    assert.ok(parser.source === parser.lexer.source);
    assert.ok(data === parser.lexer.source);

    assert.end();
});

