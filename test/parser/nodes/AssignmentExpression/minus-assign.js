'use strict';

const data =
`userIndex -= 123`;

const node = {
	type: 'AssignmentExpression',
	operator: '-=',
	start: 0,
	end: 16,
	left: {
		type: 'Identifier',
		name: 'userIndex',
		start: 0,
		end: 9,
	},
	right: {
		type: 'Literal',
		value: `123`,
		start: 13,
		end: 16,
	}
};

module.exports = {
	data,
	node
};
