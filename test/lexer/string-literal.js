'use strict';

const test = require('tape');

const Lexer = require('../../lib/lexer');

test('Lexer - Errors with line endings in string literals', t => {
    // This can't be done with error cases because text editors transform line endings
    t.throws(() => Lexer.all(String.raw`\n`), /LexerError: \[Source]: Unexpected token "\\" \(1:1\)/);
    t.throws(() => Lexer.all(String.raw`\r`), /LexerError: \[Source]: Unexpected token "\\" \(1:1\)/);
    t.throws(() => Lexer.all(String.raw`\r\n`), /LexerError: \[Source]: Unexpected token "\\" \(1:1\)/);
    t.end();
});
