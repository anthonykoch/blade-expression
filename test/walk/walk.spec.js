'use strict';

const test = require('tape');

const { Parser: { parse } } = require('../utils');
const { walk } = require('../../lib/walk');

test('walk Literal', (assert) => {
	assert.plan(1);

	const data = `123`;
	const ast = parse(data);

	walk(ast, {
		Literal() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk Identifier', (assert) => {
	assert.plan(1);

	const data = `user`;
	const ast = parse(data);

	walk(ast, {
		Identifier() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk SpreadElement', (assert) => {
	assert.plan(1);

	const data = `[...users]`;
	const ast = parse(data);

	walk(ast, {
		SpreadElement() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk ThisExpression', (assert) => {
	assert.plan(1);

	const data = `this`;
	const ast = parse(data);

	walk(ast, {
		ThisExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk SequenceExpression', (assert) => {
	assert.plan(1);

	const data = `123, 456`;
	const ast = parse(data);

	walk(ast, {
		SequenceExpression(node) {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk Identifiers of SequenceExpression', (assert) => {
	assert.plan(2);

	const data = `hello, user`;
	const ast = parse(data);
	const expressions = [];

	walk(ast, {
		SequenceExpression(node) {
			assert.ok(true);
		},
		Identifier(node) {
			expressions.push(node);
		}
	});

	assert.deepEquals(expressions, [
		{
			type: 'Identifier',
			name: 'hello',
			start: 0,
			end: 5
		},
		{
			type: 'Identifier',
			name: 'user',
			start: 7,
			end: 11
		}
	], 'Items are added in order');

	assert.end();
});

test('walk NewExpression', (assert) => {
	assert.plan(1);

	const data = `new User`;
	const ast = parse(data);

	walk(ast, {
		NewExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk CallExpression', (assert) => {
	assert.plan(1);

	const data = `user()`;
	const ast = parse(data);

	walk(ast, {
		CallExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk MemberExpression', (assert) => {
	assert.plan(1);

	const data = `user.name`;
	const ast = parse(data);

	walk(ast, {
		MemberExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk YieldExpression', (assert) => {
	assert.plan(1);

	const data = `yield user`;
	const ast = parse(data, { context: { inGenerator: true }});

	walk(ast, {
		YieldExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk ArrayExpression', (assert) => {
	assert.plan(1);

	const data = `[]`;
	const ast = parse(data);

	walk(ast, {
		ArrayExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk Property', (assert) => {
	assert.plan(1);

	const data = `{ name }`;
	const ast = parse(data);

	walk(ast, {
		Property() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk ObjectExpression', (assert) => {
	assert.plan(1);

	const data = `{}`;
	const ast = parse(data);

	walk(ast, {
		ObjectExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk UpdateExpression', (assert) => {
	assert.plan(1);

	const data = `user.id++`;
	const ast = parse(data);

	walk(ast, {
		UpdateExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk UnaryExpression', (assert) => {
	assert.plan(1);

	const data = `-user.id`;
	const ast = parse(data);

	walk(ast, {
		UnaryExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk LogicalExpression', (assert) => {
	assert.plan(1);

	const data = `1 || 2`;
	const ast = parse(data);

	walk(ast, {
		LogicalExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk BinaryExpression', (assert) => {
	assert.plan(1);

	const data = `1 + 1`;
	const ast = parse(data);

	walk(ast, {
		BinaryExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk ArrowExpression', (assert) => {
	assert.plan(1);

	const data = `user => 123`;
	const ast = parse(data);

	walk(ast, {
		ArrowExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk ConditionalExpression', (assert) => {
	assert.plan(1);

	const data = `(user) ? 1 : 0`;
	const ast = parse(data);

	walk(ast, {
		ConditionalExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk AssignmentExpression', (assert) => {
	assert.plan(1);

	const data = `name = 'Randall'`;
	const ast = parse(data);

	walk(ast, {
		AssignmentExpression() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk ExpressionStatement', (assert) => {
	assert.plan(1);

	const data = `123`;
	const ast = parse(data);

	walk(ast, {
		ExpressionStatement() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk Program', (assert) => {
	assert.plan(1);

	const data = `123`;
	const ast = parse(data);

	walk(ast, {
		Program() {
			assert.ok(true);
		}
	});

	assert.end();
});

test('walk complex ast', (assert) => {
	assert.plan(37);

	const data = `this.name = yield name, user.id * users[index] + new User()
					|| isValid([...users], (item) => -item++) ? { name } : null`;

	const ast = parse(data, {
		context: { inGenerator: true }
	});

	const identifiers = [];

	walk(ast, {

		Literal() {              // 1
			assert.ok(true);
		},

		Identifier(node) {           // 10
			assert.ok(true);
			identifiers.push(node.name);
		},

		SpreadElement() {        // 1
			assert.ok(true);
		},

		ThisExpression() {       // 1
			assert.ok(true);
		},

		SequenceExpression() {   // 1
			assert.ok(true);
		},

		NewExpression() {        // 1
			assert.ok(true);
		},

		CallExpression() {       // 1
			assert.ok(true);
		},

		MemberExpression() {     // 2
			assert.ok(true);
		},

		YieldExpression() {      // 1
			assert.ok(true);
		},

		ArrayExpression() {      // 1
			assert.ok(true);
		},

		Property() {             // 1
			assert.ok(true);
		},

		ObjectExpression() {     // 1
			assert.ok(true);
		},

		UpdateExpression() {     // 1
			assert.ok(true);
		},

		UnaryExpression() {      // 1
			assert.ok(true);
		},

		LogicalExpression() {    // 1
			assert.ok(true);
		},

		BinaryExpression() {        // 1
			assert.ok(true);
		},

		ArrowExpression() {         // 1
			assert.ok(true);
		},

		ConditionalExpression() {   // 1
			assert.ok(true);
		},

		AssignmentExpression() {    // 1
			assert.ok(true);
		},

		ExpressionStatement() {     // 1
			assert.ok(true);
		},

		Program() {                 // 1
			assert.ok(true);
		}
	});

	assert.deepEquals(identifiers, ['name', 'name', 'user', 'id', 'users', 'index', 'User', 'isValid', 'users', 'item', 'item', 'name', 'name']);

	assert.end();
});
