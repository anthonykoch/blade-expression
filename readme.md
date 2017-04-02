
# blade-expression

A parser for JavaScript expressions created according to the [ES6 specification](http://www.ecma-international.org/ecma-262/6.0/#sec-expressions). The AST nodes are modeled after the [SpiderMonkey Parser spec](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API) aside from how locations are stored.

# Size

Weighs in at `26KB` minified and `8.5 kB` gzipped.


# Usage

The usage is pretty straightforward. For more information on the API, see [the docs](/docs/API.md).

```js
const Parser = require('./blade-expression');

// Creating a parser object
const parser = Parser.create(data, options);
const ast = parser.parse();

// Shortcut
const data   = `'Hello ' + user.name`;
const ast = Parser.parse(data, options);
```

You can also require the lexer.

```js
const Lexer = require('./blade-expression/lexer');

// Token types may be required also
const { TokenNumericLiteral } = require('./blade-expression/constants/tokens');

// Consume all tokens
const tokens = Lexer.all(data, options);

// Consume token by token
const lexer = new Lexer(data, options);
lexer.nextToken();

// Consume all tokens if in an ES6 environment
for (let token of lexer) {
	console.log(token);
}
```


# Important notes

### Semantic errors

Not all semantic errors (e.g. strict mode errors) have been coded into the parser yet.

### Statements as expressions

The parsing is done as if the data passed has been wrapped in parens, thus causing some statements to be interpreted as expressions.

- **Object literals**

 Empty brackets (e.g. `{}`) are parsed as object literals rather than block statements.


# Supported Expressions

 Expression                 | Example
----------------------------|--------------------------------
 ParenthesizedExpression    | `(user.name)`
 ArrowFunction (no block)   | `(user) => user.name`
 SequenceExpression         | `'hey there', 'hello'`
 AssignmentExpression       | `hello = 123`
 ThisExpression             | `this`
 YieldExpression            | `yield` or `yield 42`
 BinaryExpression           | `42 + 32`
 LogicalExpression          | `user && user.name`
 RelationalExpression       | `user !== undefined`
 UnaryExpression            | `-usersIndex` or `delete user.name`
 UpdateExpression           | `++userIndex` or `userIndex--`
 NewExpression              | `new Person('Randall')` or `new Person`
 CallExpression             | `sayHello('tomylittle', ...['friend'])`
 MemberExpression           | `user.name` or `user['name' + hello]`
 ObjectExpression           | `{ age: 20, name }`
 ArrayExpression            | `['Jim',,,'Bob', ...otherList]`
 SpreadElement              | `[...usersList]`
 BooleanLiteral             | `true` or `false`
 NullLiteral                | `null`
 StringLiteral              | `"Hello"`
 DecimalLiteral             | `42` or `4.2` or `42e+12`
 BinaryLiteral              | `0b01`
 HexLiteral                 | `0x01`
 Identifier                 | `hello`


### No Support (for now)

- Template strings

- Regular Expressions

- Destructuring


### Will never support

- Function expressions

- Class expressions

- Object literal getter and setters

 There is no way to parse function bodies because there is no support for parsing statements. Therefore it is pointless to attempt to parse function expressions, object methods, class methods. Only arrow functions will implicit returns are supported.

- Meta properties and super

 There's no point in supporting these either since these are only allowed inside functions, which are not supported.


## Todo

- Change `null` to type `TYPE_NULL` and `true` and `false` to `TYPE_BOOLEAN` instead of being `TYPE_KEYWORD` keywords.

- Figure out why minified version is throwing errors

- Add raw values to primary expressions
