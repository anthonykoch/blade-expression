'use strict';

const data =
`~ user`;

const node = {
	type: 'UnaryExpression',
	operator: '~',
	prefix: true,
	start: 0,
	end: 6,
	argument: {
		type: 'Identifier',
		name: 'user',
		start: 2,
		end: 6,
	},
};

module.exports = {
	data,
	node
};
