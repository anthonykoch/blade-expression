'use strict';

const test = require('tape');

const { Parser: { parse } } = require('../utils');

const RE_INVALID_LHS_POSTFIX =
	 /Invalid left-hand side expression in postfix operation/

const RE_INVALID_LHS_PREFIX  =
	/Invalid left-hand side expression in prefix operation/

const RE_STRICT_DELETE =
	/Delete of an unqualified identifier in strict mode./;

const RE_INVALID_LHS_IN_ASSIGN = /Invalid left-hand side in assignment/

const RE_UNEXPECTED_RESERVED_WORD =
	/Unexpected strict mode reserved word/

function setup(data) {
	return parse(data, { context: { strict: true }})
}

function setupNonStrict(data) {
	return parse(data)
}

test('Automatic Semicolon Insertion', (assert) => {
	assert.throws(() => setup(`id\n++`), /Unexpected end of input/,
		'update expression');

	assert.throws(() => setup(`user.id = id\n--`), /Unexpected end of input/,
		'decrement expression');

	assert.end();
});

test('Delete in strict mode throws', (assert) => {
	assert.throws(() => setup(`delete a`),   RE_STRICT_DELETE);
	assert.throws(() => setup(`delete (a)`), RE_STRICT_DELETE);

	assert.doesNotThrow(() => setup(`delete (user.name)`));
	assert.doesNotThrow(() => setup(`delete user.name`));

	assert.end();
});

test('Update expressions throw for invalid left hand side', (assert) => {
	assert.throws(() => setup(`++hello--`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`++hello++`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`--hello--`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`--hello++`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`hello++++`), RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`hello++--`), RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`hello----`), RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`++++hello`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`++--hello`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`----hello`), RE_INVALID_LHS_PREFIX);

	assert.throws(() => setup(`++123--`), RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`++123++`), RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`--123--`), RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`--123++`), RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`123++++`), RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`123++--`), RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`123----`), RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`++++123`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`++--123`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`----123`), RE_INVALID_LHS_PREFIX);

	assert.throws(() => setup(`++user.name--`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`++user.name++`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`--user.name--`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`--user.name++`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`user.name++++`), RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`user.name++--`), RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`user.name----`), RE_INVALID_LHS_POSTFIX);

	assert.throws(() => setup(`++++user.name`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`++--user.name`), RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`----user.name`), RE_INVALID_LHS_PREFIX);

	assert.throws(() => setup(`--{}`),  RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`{}--`),  RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`--[]`),  RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`[]--`),  RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`+++[]`), RE_INVALID_LHS_PREFIX);

	['user', 'user.name']
		.forEach((value) => {
			assert.doesNotThrow(() => setup(`--${value}`));
			assert.doesNotThrow(() => setup(`++${value}`));
			assert.doesNotThrow(() => setup(`${value}++`));
			assert.doesNotThrow(() => setup(`${value}--`))
			assert.doesNotThrow(() => setup(`+${value}--`))
			assert.doesNotThrow(() => setup(`-${value}--`))
		});

	assert.end();
});

test('Assignment semantic errors', (assert) => {
	assert.throws(() => setup(`delete = 123`),         /Unexpected token =/);
	assert.throws(() => setup(`123 = 123`),            RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`'hello' = 123`),        RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`"hello" = 123`),        RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`0b01 = 123`),           RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`0x2 = 123`),            RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`++user = 123`),         RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`user++ = 123`),         RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`user.name++ = 123`),    RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`++user.name = 123`),    RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`[] = 123`),             RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`++[] = 123`),           RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`[]++ = 123`),           RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`-[] = 123`),            RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`+[] = 123`),            RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`{} = 123`),             RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`++{} = 123`),           RE_INVALID_LHS_PREFIX);
	assert.throws(() => setup(`{}++ = 123`),           RE_INVALID_LHS_POSTFIX);
	assert.throws(() => setup(`-{} = 123`),            RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`+{} = 123`),            RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`user() = 123`),         RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`new user() = 123`),     RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`new user = 123`),       RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`(123) = 123`),          RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`('123') = 123`),        RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`this = 123`),           RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`(user) ? 1 : 2 = 123`), RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`left + right = 123`),   RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`left / right = 123`),   RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`left & right = 123`),   RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`left ** right = 123`),  RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`left && right = 123`),  RE_INVALID_LHS_IN_ASSIGN);
	assert.throws(() => setup(`left || right = 123`),  RE_INVALID_LHS_IN_ASSIGN);

	assert.throws(() => setup(`...user = 123`),   /Unexpected token \.\.\./);
	assert.throws(() => setup(`(...user) = 123`), /Unexpected token \.\.\./);

	assert.throws(() => setup(`yield = 123`),                RE_UNEXPECTED_RESERVED_WORD);
	assert.doesNotThrow(() => setupNonStrict(`yield = 123`));

	assert.doesNotThrow(() => setup(`user.name = 123`));
	assert.doesNotThrow(() => setup(`user.name.first = 123`));
	assert.doesNotThrow(() => setup(`(user) = 123`));

	assert.end();
});
