'use strict';

const data =
`yield 123`;

const node = {
	type: 'YieldExpression',
	delegates: false,
	start: 0,
	end: 9,
	argument: {
		type: 'Literal',
		value: '123',
		start: 6,
		end: 9
	}
};

module.exports = {
	context: { inGenerator: true },
	data,
	node
};
