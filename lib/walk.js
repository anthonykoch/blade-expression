'use strict';

function walk(ast, handlers={}) {
	recurse(ast, null);

	function recurse(node, parent, override) {
		if (node === null && parent && 'ArrayExpression' === parent.type) {
			return;
		}

		const type = override || node.type;
		const handler = handlers[type];

		if (visitors[type] === undefined) {
			throw new Error(`Unrecogenized node ${type}`);
		}

		visitors[type](node, recurse);

		if (handler) {
			handler(node, parent);
		}
	}
}

const visitors = {

	ThisExpression: noop,

	Literal: noop,

	Identifier: noop,

	SequenceExpression: loop('expressions'),

	SpreadElement(node, recurse) {
		recurse(node.argument, node);
	},

	NewExpression(node, recurse) {
		recurse(node.callee, node);
		visitors.Arguments(node.arguments, node, recurse);
	},

	CallExpression(node, recurse) {
		recurse(node.callee, node);
		visitors.Arguments(node.arguments, node, recurse);
	},

	MemberExpression(node, recurse) {
		recurse(node.object, node);
		recurse(node.property, node);
	},

	YieldExpression(node, recurse) {
		recurse(node.argument, node);
	},

	ArrayExpression: loop('elements'),

	// ArrayExpression(node, recurse) {
	// 	const elements = node.elements;
	// 	for (var i = 0; i < elements.length; i++) {
	// 		if (elements[i] !== null) {

	// 		}
	// 	}
	// },

	Property(node, recurse) {
		recurse(node.key, node);

		if (node.value) {
			recurse(node.value, node);
		}
	},

	ObjectExpression: loop('properties'),

	UpdateExpression(node, recurse) {
		recurse(node.argument, node);
	},

	UnaryExpression(node, recurse) {
		recurse(node.argument, node);
	},

	LogicalExpression(node, recurse) {
		recurse(node.left, node);
		recurse(node.right, node);
	},

	BinaryExpression(node, recurse) {
		recurse(node.left, node);
		recurse(node.right, node);
	},

	Arguments(items, parent, recurse) {
		for (let i = 0; i < items.length; i++) {
			recurse(items[i], parent);
		}
	},

	ArrowExpression(node, recurse) {
		visitors.Arguments(node.parameters, node, recurse);
		recurse(node.body, node);
	},

	ConditionalExpression(node, recurse) {
		recurse(node.test, node);
		recurse(node.consequent, node);
		recurse(node.alternate, node);
	},

	AssignmentExpression(node, recurse) {
		recurse(node.left, node);
		recurse(node.right, node);
	},

	ExpressionStatement(node, recurse) {
		recurse(node.expression, node);
	},

	Program: loop('body')

}

function loop(prop) {
	return function(node, recurse) {
		const items = node[prop];
		const length = items.length;

		for (let i = 0; i < length; i++) {
			recurse(items[i], node);
		}
	}
}

function noop() {}

module.exports = {
	walk,
	visitors
};
