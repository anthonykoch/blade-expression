'use strict';

const test = require('tape');

// TODO: Fix

const { parse } = require('../../lib/parser');
const { walk } = require('../../lib/walk');

test('walk Literal', t => {
  t.plan(1);

  const data = `123`;
  const ast = parse(data);

  walk(ast, {
    Literal() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk Identifier', t => {
  t.plan(1);

  const data = `user`;
  const ast = parse(data);

  walk(ast, {
    Identifier() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk SpreadElement', t => {
  t.plan(1);

  const data = `[...users]`;
  const ast = parse(data);

  walk(ast, {
    SpreadElement() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk ThisExpression', t => {
  t.plan(1);

  const data = `this`;
  const ast = parse(data);

  walk(ast, {
    ThisExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk SequenceExpression', t => {
  t.plan(1);

  const data = `123, 456`;
  const ast = parse(data);

  walk(ast, {
    SequenceExpression(node) {
      t.ok(true);
    }
  });

  t.end();
});

test('walk Identifiers of SequenceExpression', t => {
  t.plan(2);

  const data = `hello, user`;
  const ast = parse(data);
  const expressions = [];

  walk(ast, {
    SequenceExpression(node) {
      t.ok(true);
    },
    Identifier(node) {
      expressions.push(node);
    }
  });

  t.deepEquals(expressions, [
    {
      type: 'Identifier',
      name: 'hello',
      start: 0,
      end: 5
    },
    {
      type: 'Identifier',
      name: 'user',
      start: 7,
      end: 11
    }
  ], 'Items are added in order');

  t.end();
});

test('walk NewExpression', t => {
  t.plan(1);

  const data = `new User`;
  const ast = parse(data);

  walk(ast, {
    NewExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk CallExpression', t => {
  t.plan(1);

  const data = `user()`;
  const ast = parse(data);

  walk(ast, {
    CallExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk MemberExpression', t => {
  t.plan(1);

  const data = `user.name`;
  const ast = parse(data);

  walk(ast, {
    MemberExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk YieldExpression', t => {
  t.plan(1);

  const data = `yield user`;
  const ast = parse(data, { context: { inGenerator: true }});

  walk(ast, {
    YieldExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk ArrayExpression', t => {
  t.plan(1);

  const data = `[]`;
  const ast = parse(data);

  walk(ast, {
    ArrayExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk Property', t => {
  t.plan(1);

  const data = `{ name }`;
  const ast = parse(data);

  walk(ast, {
    Property() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk ObjectExpression', t => {
  t.plan(1);

  const data = `{}`;
  const ast = parse(data);

  walk(ast, {
    ObjectExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk UpdateExpression', t => {
  t.plan(1);

  const data = `user.id++`;
  const ast = parse(data);

  walk(ast, {
    UpdateExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk UnaryExpression', t => {
  t.plan(1);

  const data = `-user.id`;
  const ast = parse(data);

  walk(ast, {
    UnaryExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk LogicalExpression', t => {
  t.plan(1);

  const data = `1 || 2`;
  const ast = parse(data);

  walk(ast, {
    LogicalExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk BinaryExpression', t => {
  t.plan(1);

  const data = `1 + 1`;
  const ast = parse(data);

  walk(ast, {
    BinaryExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk ArrowExpression', t => {
  t.plan(1);

  const data = `user => 123`;
  const ast = parse(data);

  walk(ast, {
    ArrowExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk ConditionalExpression', t => {
  t.plan(1);

  const data = `(user) ? 1 : 0`;
  const ast = parse(data);

  walk(ast, {
    ConditionalExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk AssignmentExpression', t => {
  t.plan(1);

  const data = `name = 'Randall'`;
  const ast = parse(data);

  walk(ast, {
    AssignmentExpression() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk ExpressionStatement', t => {
  t.plan(1);

  const data = `123`;
  const ast = parse(data);

  walk(ast, {
    ExpressionStatement() {
      t.ok(true);
    }
  });

  t.end();
});

test('walk Program', t => {
  t.plan(1);

  const data = `123`;
  const ast = parse(data);

  walk(ast, {
    Program() {
      t.ok(true);
    }
  });

  t.end();
});

// FIXME
test.skip('walk complex ast', t => {
  t.plan(37);

  const data = `this.name = yield name, user.id * users[index] + new User()
          || isValid([...users], (item) => -item++) ? { name } : null`;

  const ast = parse(data, {
    context: { inGenerator: true }
  });

  const identifiers = [];

  walk(ast, {

    Literal() {              // 1
      t.ok(true);
    },

    Identifier(node) {           // 10
      t.ok(true);
      identifiers.push(node.name);
    },

    SpreadElement() {        // 1
      t.ok(true);
    },

    ThisExpression() {       // 1
      t.ok(true);
    },

    SequenceExpression() {   // 1
      t.ok(true);
    },

    NewExpression() {        // 1
      t.ok(true);
    },

    CallExpression() {       // 1
      t.ok(true);
    },

    MemberExpression() {     // 2
      t.ok(true);
    },

    YieldExpression() {      // 1
      t.ok(true);
    },

    ArrayExpression() {      // 1
      t.ok(true);
    },

    Property() {             // 1
      t.ok(true);
    },

    ObjectExpression() {     // 1
      t.ok(true);
    },

    UpdateExpression() {     // 1
      t.ok(true);
    },

    UnaryExpression() {      // 1
      t.ok(true);
    },

    LogicalExpression() {    // 1
      t.ok(true);
    },

    BinaryExpression() {        // 1
      t.ok(true);
    },

    ArrowExpression() {         // 1
      t.ok(true);
    },

    ConditionalExpression() {   // 1
      t.ok(true);
    },

    AssignmentExpression() {    // 1
      t.ok(true);
    },

    ExpressionStatement() {     // 1
      t.ok(true);
    },

    Program() {                 // 1
      t.ok(true);
    }
  });

  t.deepEquals(identifiers, ['name', 'name', 'user', 'id', 'users', 'index', 'User', 'isValid', 'users', 'item', 'item', 'name', 'name']);

  t.end();
});
