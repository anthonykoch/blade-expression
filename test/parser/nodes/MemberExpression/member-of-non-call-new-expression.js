'use strict';

const data =
`new Person.name`;

const node = {
	type: 'NewExpression',
	start: 0,
	end: 15,
	arguments: [],
	callee: {
		type: 'MemberExpression',
		start: 4,
		end: 15,
		computed: false,
		object: {
			type: 'Identifier',
			name: 'Person',
			start: 4,
			end: 10,
		},
		property: {
			type: 'Identifier',
			name: 'name',
			start: 11,
			end: 15,
		}
	}
};

module.exports = {
	data,
	node
};
