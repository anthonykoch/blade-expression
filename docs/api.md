
## Parser

### .parse(data, options)

Returns an AST of the expression that was passed. This is a shortcut to having to create a parser and call the `parse` function on it.

```js
const Parser = require('blade-expression');

const ast = Parser.parser('delete user.name', {
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
// An overview of all options
const options = {
	useStickyRegex: false,
	context: {
		strict: true,
		inGenerator: true
	}
};

const ast = Parser.parse(data, options);
```

##### options.useStickyRegex

Type: `Boolean` Default: `true`

If set to true, the lexer will attempt to lex with sticky regular expressions (assuming the environment supports the ES6 sticky regex feature), otherwise it falls back to reducing its input. There's not really a point in setting this to false. The sticky regex option is slightly faster and is more memory efficient. But, if you want to turn it off, feel free.

##### options.context.strict

Type: `Boolean` Default: `false`

Whether or not the code should be parsed in strict mode.

##### options.context.inGenerator

Type: `Boolean` Default: `false`

Wether or not the expression being parsed should be considered as an expression inside of a generator function.

## Parser instance

### .parse(data, options)

Uses the same options as [`Parser.parse`](/#user-content-parsedata-options).

```js
const parser = Parser.create(data, options);
const ast = parser.parse();
```


## Lexer

### .all(data, options)

#### data

Type: `String`

The data to lex.

Returns all tokens for a given string.


## Lexer instance

### .nextToken()

Return: `Object|null`

Returns the next token from the lexer, or `null` if there are no more tokens to be found. This will not throw an error no matter how many times you call it after it returns `null`.

### .lookahead(index)

#### index

Type: `Number`

Return: `Object|null`

Lexes tokens up to `index` and returns the token at `index` or null if there is no token that is found. This will not modify the output returned from `.nextToken()`. Throws an error if the index is less than 1
