'use strict';

const data =
`new Person().name`;

const node = {
	type: 'MemberExpression',
	start: 0,
	end: 17,
	computed: false,
	object: {
		type: 'NewExpression',
		start: 0,
		end: 12,
		arguments: [],
		callee: {
			type: 'Identifier',
			name: 'Person',
			start: 4,
			end: 10,
		}
	},
	property: {
		type: 'Identifier',
		name: 'name',
		start: 13,
		end: 17,
	}
};

module.exports = {
	data,
	node
};
