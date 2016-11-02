'use strict';

const data =
`[,,,1,2,,3,]`;

const node = {
	type: 'ArrayExpression',
	start: 0,
	end: 12,
	elements: [
		null,
		null,
		null,
		{
			type: 'Literal',
			value: '1',
			start: 4,
			end: 5,
		},
		{
			type: 'Literal',
			value: '2',
			start: 6,
			end: 7,
		},
		null,
		{
			type: 'Literal',
			value: '3',
			start: 9,
			end: 10,
		},
	]
};

module.exports = {
	data,
	node
};
