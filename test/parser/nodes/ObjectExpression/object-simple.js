'use strict';

const data =
`{ greeting: 'Hello' }`;

const node = {
	type: 'ObjectExpression',
	start: 0,
	end: 21,
	properties: [
		{
			type: 'Property',
			kind: 'init',
			shorthand: false,
			computed: false,
			method: false,
			start: 2,
			end: 19,
			key: {
				type: 'Identifier',
				name: 'greeting',
				start: 2,
				end: 10,
			},
			value: {
				type: 'Literal',
				value: `'Hello'`,
				start: 12,
				end: 19,
			}
		}
	]
};

module.exports = {
	data,
	node
};
