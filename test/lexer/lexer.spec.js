'use strict';

const test = require('tape');

const Lexer = require('../../lib/lexer');
const DistLexer = require('../../dist/bladeexp.js').Lexer;
const DistMinLexer = require('../../dist/bladeexp.min.js').Lexer;

[Lexer, DistLexer, DistMinLexer].map(Lexer => {
    test('Lexer - reduces input when using non-sticky regex', (assert) => {
        const data = `name + greeting`;
        const lexer = Lexer.create(data);
        lexer.nextToken();
        assert.notEqual(lexer.input, data);
        assert.end();
    });

    test('Lexer - strips BOM', t => {
        t.equals(Lexer.create('\uFEFFhello').input, 'hello');
        t.notEquals(Lexer.create('hello\uFEFF'), 'hello\uFEFF',
            'does not remove BOM ');
        t.end();
    });

    test('Lexer.create - returns an object', (assert) => {
        const data = `name + greeting`;
        const lexer = Lexer.create(data);
        assert.ok(lexer);
        assert.equal(typeof lexer, 'object');
        assert.throws(() => Lexer.create(), /of undefined/);
        assert.end();
    });

    test('lexer.nextToken', (assert) => {
        const data = `name + greeting`;
        const lexer = Lexer.create(data);

        assert.equals(lexer.nextToken().value, 'name',     'returns first token');
        assert.equals(lexer.nextToken().value, '+',        'returns second token');
        assert.equals(lexer.nextToken().value, 'greeting', 'returns third token');
        assert.equals(lexer.nextToken(),        null,      'end of tokens');

        assert.end();
    });

    test('lexer.skipWhitespace', (assert) => {
        const data = `     name     +     greeting     `;
        const lexer = Lexer.create(data);
        lexer.skipWhitespace();
        assert.equals(lexer.position, 5, 'skips whitespace')
        assert.end();
    });

    test('lexer.lookahead', (assert) => {
        const data = `     name     +     greeting     `;
        const lexer = Lexer.create(data);

        assert.equal(lexer.lookahead(3).value, 'greeting', 'lookahead token');
        assert.equal(lexer.lookahead(4), null, 'null token');

        assert.equals(lexer.stash[0].value, 'name',     'first token');
        assert.equals(lexer.stash[1].value, '+',        'second token');
        assert.equals(lexer.stash[2].value, 'greeting', 'third token');

        assert.end();
    });

    test('lexer.peek', (assert) => {
        const data = `     name     +     greeting     `;
        const lexer = Lexer.create(data);

        assert.equal(lexer.peek().value, 'name', 'peek token');
        lexer.nextToken();
        assert.equal(lexer.peek().value, '+', 'peek token');
        lexer.nextToken();
        assert.equal(lexer.peek().value, 'greeting', 'peek token');
        lexer.nextToken();
        assert.equal(lexer.peek(), null, 'null token');

        assert.end();
    });

    test('lexer.peek', (assert) => {
        const data = `     name     +     greeting     `;
        const lexer = Lexer.create(data);

        assert.throws(() => lexer.error('Ya dun'), /Ya dun/, 'lexer throws');
        assert.end();
    });
});
