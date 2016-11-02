'use strict';

const data =
`hello(123, 'people')`;

const node = {
	type: 'CallExpression',
	start: 0,
	end: 20,
	arguments: [
		{
			type: 'Literal',
			value: '123',
			start: 6,
			end: 9,
		},
		{
			type: 'Literal',
			value: `'people'`,
			start: 11,
			end: 19,
		}
	],
	callee: {
		type: 'Identifier',
		name: 'hello',
		start: 0,
		end: 5,
	}
};

module.exports = {
	data,
	node
};
