'use strict';

const data =
`123, 456`;

const node = {
	type: 'SequenceExpression',
	start: 0,
	end: 8,
	expressions: [
		{
			type: 'Literal',
			value: '123',
			start: 0,
			end: 3,
		},
		{
			type: 'Literal',
			value: '456',
			start: 5,
			end: 8,
		}
	]
};

module.exports = {
	data,
	node
};
