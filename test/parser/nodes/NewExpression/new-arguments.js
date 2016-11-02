'use strict';

const data =
`new Hello(123, 'hello')`;

const node = {
	type: 'NewExpression',
	start: 0,
	end: 23,
	arguments: [
		{
			type: 'Literal',
			value: '123',
			start: 10,
			end: 13,
		},
		{
			type: 'Literal',
			value: `'hello'`,
			start: 15,
			end: 22,
		}
	],
	callee: {
		type: 'Identifier',
		name: 'Hello',
		start: 4,
		end: 9,
	}
};

module.exports = {
	data,
	node
};
