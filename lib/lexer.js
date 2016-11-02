'use strict';

// module.exports = Lexer;

const assign = require('object-assign');

const { count,
		createSourceError } = require('./utils');

const { Punctuator,
		NumericLiteral,
		StringLiteral,
		ReservedWord,
		IdentifierName } = require('./constants/regex');

const { TokenKeyword,
		TokenIdentifier,
		TokenPunctuator,
		TokenStringLiteral,
		TokenNumericLiteral } = require('./constants/tokens');

const keywords = {
	'break':      true,
	'do':         true,
	'in':         true,
	'typeof':     true,
	'case':       true,
	'else':       true,
	'instanceof': true,
	'var':        true,
	'catch':      true,
	'export':     true,
	'new':        true,
	'void':       true,
	'class':      true,
	'extends':    true,
	'return':     true,
	'while':      true,
	'const':      true,
	'finally':    true,
	'super':      true,
	'with':       true,
	'continue':   true,
	'for':        true,
	'switch':     true,
	'yield':      true,
	'debugger':   true,
	'function':   true,
	'this':       true,
	'default':    true,
	'if':         true,
	'throw':      true,
	'delete':     true,
	'import':     true,
	'try':        true,
	'null':       true,
	'true':       true,
	'false':      true,
};

let _SUPPORTS_STICKY;

try {
	(function checkStickySupport() {
		_SUPPORTS_STICKY = (eval('/pls/y')).sticky === true;
	}());
} catch (err) {
	_SUPPORTS_STICKY = false;
}

const SUPPORTS_STICKY = _SUPPORTS_STICKY;
const RE_IDENTIFIER_NAME = new RegExp('^' + IdentifierName.source);

const Lexer = {

	/**
	 * Creates a lexer object.
	 *
	 * @param  {Object} options
	 * @return {Object}
	 */

	create(data, options) {
		return Object.create(LexerPrototype).init(data, options);
	},

	/**
	 * Returns all tokens for a given string.
	 *
	 * @param  {String} data - The data to be tokenized
	 * @param  {String} options - Options to pass to lexer.init
	 * @return {Array.<Object>}
	 */

	all(data, options) {
		const lexer = Lexer.create(data, options);
		const tokens = [];
		let token;

		while (token = lexer.nextToken()) {
			tokens.push(token);
		}

		return tokens;
	}

};

const regexes = getRegexes.call(Object.create(null), SUPPORTS_STICKY);

const LexerPrototype = {};

assign(LexerPrototype, {

	/**
	 * Initiates a lexer object.
	 *
	 * @param {Object} options
	 * @param {String} options.data - The data to be lexed
	 * @param {String} options.customDirectives - Custom directives lex
	 * @return {this}
	 */

	init(data, opts) {
		const options = opts || {};
		const { useStickyRegex=true } = options;

		let source = data
			.replace(/\r\n|[\n\r]/g, '\n')

		if (source.charAt(0) === '\uFEFF') {
			source = source.slice(1);
		}

		this.line           = 1;
		this.column         = 0;
		this.position       = 0;
		this.stash          = [];
		this.source         = this.input = source;
		this.inputLength    = this.source.length;
		this.ended          = false;
		this.useStickyRegex = useStickyRegex && SUPPORTS_STICKY;

		let regs;

		if ( ! this.useStickyRegex) {
			regs = getRegexes.call(this, false);
		} else {
			regs = regexes;
		}

		this.Punctuator     = regs.Punctuator;
		this.NumericLiteral = regs.NumericLiteral;
		this.StringLiteral  = regs.StringLiteral;
		this.ReservedWord   = regs.ReservedWord;
		this.IdentifierName = regs.IdentifierName;

		if (this.useStickyRegex) {
			this.resetLastIndex(0);
		}

		return this;
	},

	/**
	 * Returns a token from the input or `null` if no tokens can be found.
	 *
	 * @return {Object|null}
	 */

	lex() {
		const token = null
				|| this.getNumericLiteraloken()
				|| this.getStringLiteralToken()
				|| this.getPunctuatorToken()
				|| this.getIdentifierNameToken()

		if (token == null) {
			this.lexError();
		}

		if (this.useStickyRegex) {
			this.resetLastIndex(token.end);
		}

		return token;
	},

	lexError() {
		const position = this.position;
		const char = this.source[position];

		const errorInfo = {
			line: this.line,
			column: this.column
		};

		if (/^['"]/.test(char)) {
			errorInfo.column = this.column + 1;
			this.error('Unterminated string literal', errorInfo);
		}

		this.error(`Unexpected token "${char}"`, errorInfo);
	},

	/**
	 * Resets the last index, which only needs to be done when we are
	 * using the sticky flag for indexes.
	 */

	resetLastIndex(lastIndex) {
		this.Punctuator.lastIndex     = lastIndex;
		this.NumericLiteral.lastIndex = lastIndex;
		this.StringLiteral.lastIndex  = lastIndex;
		this.ReservedWord.lastIndex   = lastIndex;
		this.IdentifierName.lastIndex = lastIndex;
	},

	/**
	 * Handles whitespace for when regex uses sticky flag
	 */

	skipWhitespace() {
		let column       = this.column
		let line         = this.line;
		let start        = this.position;
		let pos          = this.position;
		let times        = 0;
		let previousLine = line;
		let char;

		while (char = this.source[pos]) {
			if ('\n' === char) {
				line = line + 1;
			} else if (' ' === char || '\t' === char) {
			} else {
				break;
			}

			pos = pos + 1;
			times = times + 1;

			if (line > previousLine) {
				column = 0;
			} else {
				column = column + 1;
			}

			previousLine = line;
		}

		if ( ! this.useStickyRegex) {
			this.input = this.input.substring(times, this.inputLength);
		}

		this.position = pos;
		this.line     = line;
		this.column   = column;
	},

	handleWhitespace() {
		this.skipWhitespace();

		if (this.useStickyRegex) {
			this.resetLastIndex(this.position);
		}

		if ( ! this.useStickyRegex) {
			if (this.input.length === 0) {
				this.ended = true;
			}
		} else {
			if (this.position >= this.inputLength) {
				this.ended = true;
			}
		}
	},

	/**
	 * Returns the token at `index` or `null` if there are no more tokens.
	 *
	 * @param  {Number} index - The number of tokens to look ahead
	 * @return {Object|null}
	 */

	lookahead(index) {
		const { stash } = this;
		let times = index - stash.length;
		let token;

		if (index < 0) {
			this.error('Lookahead index can not be less than 0');
		}

		if (stash[index - 1] !== undefined) {
			return stash[index - 1];
		}

		while (times-- > 0) {
			this.handleWhitespace();

			if (this.ended) {
				break;
			}

			token = this.lex();

			if (token) {
				stash.push(token);
			}
		}

		return stash[index - 1] || null;
	},

	/**
	 * Returns the next token without consuming the token or null if no
	 * tokens can be found.
	 *
	 * @return {Object|null}
	 */

	peek() {
		return this.lookahead(1);
	},

	/**
	 * Returns and consumes the next token or `null` if there are no more
	 * tokens to be consumed from the input.
	 *
	 * @return {Object|null}
	 */

	nextToken() {
		let token;

		if (this.stash.length) {
			// Even if we've ended we need to return from the stash
			return this.stash.shift();
		} else if (this.ended) {
			// If we've already ended, return null
			return null;
		}

		this.handleWhitespace();

		if (this.ended) {
			return null;
		}

		token = this.lex();

		return token;
	},

	/**
	 * Implementation of the iterator protocol.
	 *
	 * The iterator is complete when there are no more tokens to be consumed.
	 *
	 * @return {Object}
	 */

	next() {
		const token = this.nextToken();

		if (token === null) {
			return {
				done: true,
				value: undefined
			}
		}

		return {
			done: false,
			value: token
		};
	},

	/**
	 * Throws an error with the message passed.
	 *
	 * @param {String} message
	 */

	error(message, { line, column }={}) {
		const err = createSourceError({
			name: 'LexerError',
			message,
			line,
			column,
			source: this.source,
		});
		throw err;
	}

});

if (typeof Symbol !== 'undefined') {

	/**
	 * Implements the iterable protocol.
	 */

	LexerPrototype[Symbol.iterator] = function () {
		return this;
	}
}

function createLex(accessor, tokenType) {
	return function lexing() {
		const position = this.position;
		const regex = this[accessor];
		let match;

		if ( ! this.useStickyRegex) {
			regex.lastIndex = 0;
		}

		if (match = regex.exec(this.input)) {
			let { '0': str } = match;

			this.forward(position, str.length, regex.lastIndex)

			return {
				type: tokenType !== undefined ? tokenType : str,
				value: str,
				line: this.line,
				column: this.column,
				start: position,
				end: this.position
			};
		}

		return null;
	};
}

assign(LexerPrototype, {

	/**
	 * Advances the lexer's position  and column based on whether or
	 * not the lexer is using sticky regex.
	 *
	 * @param {Number} start     - The starting position before lexing
	 * @param {Number} length    - The length of the matched string
	 * @param {Number} lastIndex - The lastIndex of the regex that matched
	 */

	forward(start, length, lastIndex) {
		if ( ! this.useStickyRegex) {
			this.input = this.input.substring(length, this.inputLength);
			this.position = start + length;
		} else {
			this.position = lastIndex;
		}

		this.column = this.column + length;
	},

	getNumericLiteraloken:
		createLex('NumericLiteral', TokenNumericLiteral),

	getStringLiteralToken:
		createLex('StringLiteral',  TokenStringLiteral),

	getIdentifierNameToken:
		createLex('IdentifierName', TokenIdentifier),

	getPunctuatorToken:
		createLex('Punctuator',     TokenPunctuator),

	getIdentifierNameToken() {
		const position = this.position;
		const regex = this.IdentifierName;
		let match;

		if ( ! this.useStickyRegex) {
			regex.lastIndex = 0;
		}

		if (match = regex.exec(this.input)) {
			const { '0': str } = match;

			this.forward(position, str.length, regex.lastIndex)

			return {
				type: keywords.hasOwnProperty(str) ? TokenKeyword : TokenIdentifier,
				value: str,
				line: this.line,
				column: this.column,
				start: position,
				end: this.position,
			};
		}

		return null;
	}

	// FIXME: Not yet implemented
	// getTemplateTemplate: createLex('Template'),

});

/**
 * Constructs regular expressions on a given object
 *
 * @param {Boolean} useStickyRegex
 * @return {this}
 */

function getRegexes(useStickyRegex) {
	const prefix = ! useStickyRegex ? '^' : '';
	const flags  =   useStickyRegex ? 'y' : 'g';

	this.Punctuator     = new RegExp(prefix + Punctuator.source,     flags);
	this.NumericLiteral = new RegExp(prefix + NumericLiteral.source, flags);
	this.StringLiteral  = new RegExp(prefix + StringLiteral.source,  flags);
	this.ReservedWord   = new RegExp(prefix + ReservedWord.source,   flags);
	this.IdentifierName = new RegExp(prefix + IdentifierName.source, flags);

	return this;
}

module.exports = Lexer;
