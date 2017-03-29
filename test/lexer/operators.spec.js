'use strict';

const test = require('tape');

const { lexerNextToken: setup,
        lexerNextValue: value } = require('../utils');

const { TokenPunctuator } = require('../../lib/constants/tokens');
const { punctuators }     = require('../../lib/constants/grammar');

test('Lexes decimal integer with correct type', (assert) => {
    assert.ok(punctuators.length, 'has items');

    punctuators.forEach((punc) => {
        assert.equal(setup(punc).type, TokenPunctuator,
            `"${punc}" has correct type`);
    });

    assert.end();
});
