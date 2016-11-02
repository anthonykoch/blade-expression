'use strict';

const data =
`{ greeting }`;

const node = {
	type: 'ObjectExpression',
	start: 0,
	end: 12,
	properties: [
		{
			type: 'Property',
			kind: 'init',
			shorthand: true,
			computed: false,
			method: false,
			start: 2,
			end: 10,
			key: {
				type: 'Identifier',
				name: 'greeting',
				start: 2,
				end: 10,
			},
			value: {
				type: 'Identifier',
				name: 'greeting',
				start: 2,
				end: 10,
			}
		}
	]
};

module.exports = {
	data,
	node
};
