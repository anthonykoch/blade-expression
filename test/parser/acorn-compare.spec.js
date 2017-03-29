'use strict';

const test = require('tape');
const _acorn = require('acorn');

const { Parser: { parse } } = require('../utils');
const depth = { objectPrintDepth : 50 };

function acorn(data) {
    return _acorn.parse(data).body[0].expression;
}

function setup(data, options) {
    return parse(data, options).body[0].expression;
}

test('Match identifier', (assert) => {
    const data = `hello`;
    assert.deepEquals(setup(data), acorn(data));
    assert.end();
});

test('Match exomplex member expression', depth, (assert) => {
    const data = `user.name.first[zero][next]`;
    assert.deepEquals(setup(data), acorn(data), 'complex member expression');
    assert.end();
});

test('Match complex call expression', depth, (assert) => {
    const data = `+user.name.first[zero][next]()`;
    assert.deepEquals(setup(data), acorn(data), 'complex member call');
    assert.end();
});

test('Match complex expression', depth, (assert) => {
    {
        const data = `[,,...users,] * hello in new Person.compute(), user.name = Randall`;
        assert.deepEquals(setup(data), acorn(data), 'complex');
    }

    {
        const data =
            `Hello + +new Person(Randall, {
                friends: [,,this,,,jimmy,, john,...users,,, [,]() / this]
            }).firstName`
        assert.deepEquals(setup(data), acorn(data), 'new expression with object');
    }

    assert.end();
});

