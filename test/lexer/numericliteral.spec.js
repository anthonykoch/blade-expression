'use strict';

const test = require('tape');

const { lexerNextToken: setup,
		lexerNextValue: value } = require('../utils');

const { TokenNumericLiteral }  = require('../../lib/constants/tokens');

test('Lexes decimal integer with correct type', (assert) => {
	const expected = '123';
	const { type: actual } = setup(expected);
	assert.equal(actual, TokenNumericLiteral, 'number literal type');
	assert.end();
});

test('Lexes integer', (assert) => {
	assert.equal(value('123'), '123', 'integer');
	assert.end();
});

test('Lexes integer with exponent', (assert) => {
	assert.equal(value('1e+12'), '1e+12', 'integer w/ exponent');
	assert.end();
});

test('Lexes leading decimal float', (assert) => {
	assert.equal(value('.123'),     '.123', 'leading decimal float');
	assert.equal(value('.123e+12'), '.123e+12', 'leading decimal float');
	assert.end();
});

test('Lexes trailing decimal float', (assert) => {
	assert.equal(value('123.'),     '123.', 'trailing decimal float');
	assert.equal(value('101.e+12'), '101.e+12', 'trailing decimal float w/ exponent');
	assert.end();
});

test('Lexes float starting with a digit', (assert) => {
	assert.equal(value('132.123'),     '132.123', 'trailing decimal float');
	assert.equal(value('132.123e+12'), '132.123e+12',
		'float starting with digit w/ exponent');

	assert.end();
});

test('Lexes hex digit', (assert) => {
	assert.equal(value('0x01'),        '0x01', 'hex digit (lowercase x)');
	assert.equal(value('0X01'),        '0X01', 'hex digit (uppercase x)');
	assert.notEqual(value('0x01e+12'), '0x01e+12',
		'hex digit with exponent fails');

	assert.end();
});

test('Lexes binary integer', (assert) => {
	assert.equal(value('0b0101'),        '0b0101',
		'binary literal (lowercase b)');

	assert.equal(value('0B0101'),        '0B0101',
		'binary literal (uppercase b)');

	assert.notEqual(value('0b0101e+12'), '0b0101e+12', 'binary exponent');
	assert.end();
});

test('Lexes octal integer', (assert) => {
	assert.equal(value('0o123'),       '0o123',      'octal literal');
	assert.notEqual(value('0o123e+12'), '0o123e+12', 'octal exponent');
	assert.end();
});
