'use strict';

const data =
`[1,2,3]`;

const node = {
	type: 'ArrayExpression',
	start: 0,
	end: 7,
	elements: [
		{
			type: 'Literal',
			value: '1',
			start: 1,
			end: 2,
		},
		{
			type: 'Literal',
			value: '2',
			start: 3,
			end: 4,
		},
		{
			type: 'Literal',
			value: '3',
			start: 5,
			end: 6,
		}
	]
};

module.exports = {
	data,
	node
};
