'use strict';

const test = require('tape');

const { allKeywords,
        lexerNextToken: setup,
        lexerNextValue: value } = require('../utils');

const { TokenIdentifier } = require('../../lib/constants/tokens');

test('Lexes identifier', (assert) => {
    assert.equals(value(`hello`),      `hello`, 'identifier');
    assert.equals(setup(`hello`).type, TokenIdentifier,
        'Identifier is lexed with correct type');

    allKeywords.forEach((keyword) => {
        assert.notEqual(setup(keyword).type, TokenIdentifier,
            `keyword "${keyword}" is not identifier`);
    });

    assert.equal(value('undefined'), 'undefined')

    assert.end();
});
