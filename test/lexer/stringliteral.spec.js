'use strict';

const test = require('tape');

const { lexerNextToken: setup,
        lexerNextValue: value } = require('../utils');

const { TokenStringLiteral }  = require('../../lib/constants/tokens');

test('Lexes string literal with correct type', (assert) => {
    assert.equals(setup(`""`).type, TokenStringLiteral,
        'double quote string has correct type');

    assert.equals(setup(`''`).type, TokenStringLiteral,
        'double quote string has correct type');

    assert.end();
});

test('Lexes string literal', (assert) => {
    assert.equals(value(`''`),       `''`,      'empty single quotes');
    assert.equals(value(`'Hello'`),  `'Hello'`, 'single quotes');
    assert.equals(value(`""`),       `""`,      'empty double quotes');
    assert.equals(value(`"Hello"`),  `"Hello"`, 'double quotes');

    assert.throws(() => value(`"\n"`),   /Unterminated string literal/,
        'string with \\n');

    assert.throws(() => value(`"\r"`),   /Unterminated string literal/,
        'string with \\r');

    assert.throws(() => value(`"\r\n"`), /Unterminated string literal/,
        'string with \\r\\n');

    assert.doesNotThrow(() => value(`"\\\r\n"`), /Unexpected token/,
        'double quote escaped \\r\\n');

    assert.doesNotThrow(() => value(`"\\\r"`),   /Unexpected token/,
        'double quote escaped \\r');

    assert.doesNotThrow(() => value(`"\\\n"`),   /Unexpected token/,
        'double quote escaped \\n');

    assert.doesNotThrow(() => value(`'\\\r\n'`), /Unexpected token/,
        'single quote escaped \\r\\n');

    assert.doesNotThrow(() => value(`'\\\r'`),   /Unexpected token/,
        'single quote escaped \\r');

    assert.doesNotThrow(() => value(`'\\\n'`),   /Unexpected token/,
        'single quote escaped \\n');

    assert.end();
});
