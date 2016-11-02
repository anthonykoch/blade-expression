'use strict';

const data =
`userIndex >>>= 123`;

const node = {
	type: 'AssignmentExpression',
	operator: '>>>=',
	start: 0,
	end: 18,
	left: {
		type: 'Identifier',
		name: 'userIndex',
		start: 0,
		end: 9,
	},
	right: {
		type: 'Literal',
		value: `123`,
		start: 15,
		end: 18,
	}
};

module.exports = {
	data,
	node
};
