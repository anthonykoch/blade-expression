'use strict';

const test = require('tape');

const { allKeywords,
        lexerNextToken: setup,
        lexerNextValue: value } = require('../utils');

const { TokenKeyword } = require('../../lib/constants/tokens');

test('allKeywords contains keywords', (assert) => {
    assert.ok(allKeywords.length > 0);
    assert.end();
});

test('Lexes decimal integer with correct type', (assert) => {
    allKeywords.forEach((keyword) => {
        assert.equal(setup(keyword).type,  TokenKeyword,
            `${keyword} has correct type`);
    });

    assert.end();
});

test('Lexes keywords', (assert) => {
    allKeywords.forEach((keyword) => {
        assert.equal(value(keyword), keyword, `keyword ${keyword}`);
    });

    allKeywords.forEach((keyword) => {
        const identifier = keyword + 'A';
        assert.notEqual(value(identifier), keyword, `Keyword ${identifier} is parsed as identifier`);
    });

    assert.end();
});
