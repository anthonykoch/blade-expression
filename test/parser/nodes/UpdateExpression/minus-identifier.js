'use strict';

const data =
`user--`;

const node = {
	type: 'UpdateExpression',
	operator: '--',
	prefix: false,
	start: 0,
	end: 6,
	argument: {
		type: 'Identifier',
		name: 'user',
		start: 0,
		end: 4,
	},
};

module.exports = {
	data,
	node
};
