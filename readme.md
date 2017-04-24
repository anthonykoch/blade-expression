
# JSParse

A parser for ES5/ES6 JavaScript expressions. Weighs in at `~26KB` minified and `~8kB` gzipped.

Some expressions are not supported or have not yet been added. See [supported expressions.](#supported-expressions)

# Usage

See the [parser options](#api).

```js
const Parser = require('./jsparse');

// Creating a parser object
const parser = new Parser(data, options);
const ast = parser.parse();

// Shortcut
const data   = `'Hello ' + user.name`;
const ast = Parser.parse(data, options);
```

You can also require the lexer.

```js
const Lexer = require('./jsparse/lexer');

// Token types may be required also
const { NumericLiteral } = require('./jsparse/constants/tokens');

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

### Destructuring

Destructuring patterns are parsed as their object, array, etc. counterpart and are not rewritten as a pattern. (This is todo).

### Simple identifiers

The regex for a valid JS identifier is quite large, so to keep things simple, identifiers may only contain unicode escape sequences and [$_a-zA-Z0-9] characters.

### Semantic errors

Not all semantic errors (e.g. strict mode errors) have been coded into the parser yet.

### Statements as expressions

The parsing is done as if the data passed has been wrapped in parens, thus causing some statements to be interpreted as expressions.

- **Object literals**

 Empty brackets (e.g. `{}`) are parsed as object literals rather than block statements.


# Supported Expressions

 Expression                 | Example
----------------------------|--------------------------------
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
 NewExpression              | `new Person()`
 CallExpression             | `getProducts()`
 MemberExpression           | `user.name` or `user['name']`
 ObjectExpression           | `{ age: 20, name }`
 ArrayExpression            | `['Jim','Bob',]`
 SpreadElement              | `[...usersList]`
 BooleanLiteral             | `true` or `false`
 NullLiteral                | `null`
 StringLiteral              | `"Hello"` or `'Hello'`
 DecimalLiteral             | `42` or `0b01` or `0x01`
 Identifier                 | `hello`


### No Support (for now)

- Regular Expressions

- Destructuring


### Will never support

- Function expressions

- Class expressions

- Object literal getter and setters

 There is no way to parse function bodies because there is no support for parsing statements. Therefore it is pointless to attempt to parse function expressions, object methods, class methods. Only arrow functions will implicit returns are supported.

- Meta properties and super

 There's no point in supporting these either since these are only allowed inside functions, which are not supported.


## API

### Parser

#### .parse(data, options)

Returns an AST of the expression that was passed. This is a shortcut to having to create a parser and call the `parse` function on it.

```js
const Parser = require('./jsparse');

const ast = Parser.parse('delete user.name', {
  context: {
    strict: true
  }
});
```

#### data

Type: `String`

The expression to be parsed.


#### options

Type: `Object`

The options passed affect how the data is parsed and lexed.

```js
// These are all options and their defaults
const options = {
  throwSourceError: true,
  consumeLeast: false,
  allowDelimited: true,
  cook: true,
  context: {
    strict: false,
    generator: false
  }
};

const ast = Parser.parse(data, options);
```

#### options.throwSourceError

Type: `Boolean` Default: `false`

Whether or not to throw an error that points to which line and column the error occured.

#### options.consumeLeast

Type: `Boolean` Default: `false`

If set to true, the parser will not error when it encouters two primary expressions not joined by a binary operator. The parser will still error when it finds an invalid expression.

You can check if there are remaining expressions through a parser's hasMore property. Each subsequent call to parser.parse() will return the next expression.

```js
// None of these will throw an error when consumeLeast is true
[] 123 // fine
user 'hello' new User // still fine

// The ast for the new expression would be returned first. If parsed
// is called again, the delete expression will be returned;
new Session() delete user.name

// However, these will still error when consumeLeast is true
// because they are not valid expressions
user +
//   ^ Unexpected end of input

delete for
//     ^ Unexpected token "for"
```

#### options.allowDelimited

Type: `Boolean` Default: `true`

Whether or not to allow expressions to be delimited by semicolons. e.g.

```
a + b; x - y;
```

If false, an error will be thrown when encountering a semicolon.

#### options.context.strict

Type: `Boolean` Default: `false`

Whether or not the code should be parsed in strict mode.

#### options.context.generator

Type: `Boolean` Default: `false`

Wether or not the expression being parsed should be considered as an expression inside of a generator function.

### Parser instance

#### .parse(data, options)

Uses the same options as [`Parser.parse`](/#user-content-parsedata-options).

```js
const parser = new Parser(data, options);
const ast = parser.parse();
```


### Lexer

#### .all(data, options)

#### data

Type: `String`

The data to lex.

Returns all tokens for a given string.

### Lexer instance

#### .nextToken()

Return: `Object|null`

Returns the next token from the lexer, or `null` if there are no more tokens to be found. This will not throw an error no matter how many times you call it after it returns `null`.

#### .lookahead(index)

Return: `Object|null`



### Todo

- [ ] Fix double start parsing as exponent operator in < ES7
