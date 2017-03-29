'use strict';

const test = require('tape');

const { Parser: { parse } } = require('../utils');

const RE_INVALID_LHS_PREFIX =
    /Invalid left-hand side expression in prefix operation/;

function setup(data) {
    return parse(data, { context: { strict: true }})
}

test('Invalid expressions should throw an error', (assert) => {
    assert.throws(() => setup(`'Hello ' + --+new Person('James', {
        friends: [,'Some',, 'People',...users]
    }).firstName`), RE_INVALID_LHS_PREFIX);

    assert.throws(() => setup(`a for`),         /Unexpected token for/,    'unexpected keyword');
    assert.throws(() => setup(`a(`),            /Unexpected end of input/, 'open paren');
    assert.throws(() => setup(`a)`),            /Unexpected token \)/,     'closing paren');
    assert.throws(() => setup(`a[`),            /Unexpected end of input/, 'computed');
    assert.throws(() => setup(`a]`),            /Unexpected token \]/,     'computed closing');
    assert.throws(() => setup(`a.`),            /Unexpected end of input/, 'property');
    assert.throws(() => setup(`123 +`),         /Unexpected end of input/, 'addition');
    assert.throws(() => setup(`123 **`),        /Unexpected end of input/, 'pow');
    assert.throws(() => setup(`123 /`),         /Unexpected end of input/, 'division');
    assert.throws(() => setup(`123 ||`),        /Unexpected end of input/, 'logical OR');
    assert.throws(() => setup(`123 ?`),         /Unexpected end of input/, 'conditional');
    assert.throws(() => setup(`123 ? user :`),  /Unexpected end of input/, 'conditional');
    assert.throws(() => setup(`123 ? user ||`), /Unexpected end of input/, 'conditional wrong or');
    assert.throws(() => setup(`user.''`),       /Unexpected string/,       'conditional wrong or');
    assert.throws(() => setup(`user.123`),      /Unexpected number/,       'conditional wrong or');

    assert.throws(() => setup(`123..`),         /Unexpected end of input/, 'number property');
    assert.doesNotThrow(() => setup(`123.`));

    assert.end();
});
