'use strict';

const argv = require('yargs').argv;
const useStickyRegex = argv.sticky === false ? false : true;

const Lexer  = require('../lib/lexer');
const Parser = require('../lib/parser');

const { punctuators } = require('../lib/constants/grammar');

const test = require('tape')

exports.Parser = Parser;
exports.Lexer = Lexer;

const parse = Parser.parse;

Parser.parse = function (data, options) {
    let opts;

    if ( ! useStickyRegex) {
        opts = Object.assign({}, options, { useStickyRegex: false });
    } else {
        opts = options;
    }

    return parse(data, opts)
};

exports.lexerNextToken = lexerNextToken;
exports.lexerNextValue = lexerNextValue;

exports.parserSetup = parserSetup;

exports.punctuators = Object.freeze(punctuators.slice(0));
exports.allKeywords = Object.freeze([
    'null',
    'true',
    'false',
    'this',
    'break',
    'do',
    'in',
    'typeof',
    'case',
    'else',
    'instanceof',
    'var',
    'catch',
    'export',
    'new',
    'void',
    'class',
    'extends',
    'return',
    'while',
    'const',
    'finally',
    'super',
    'with',
    'continue',
    'for',
    'switch',
    'yield',
    'debugger',
    'function',
    'this',
    'default',
    'if',
    'throw',
    'delete',
    'import',
    'try',
]);

function lexerNextValue(data, options) {
    if (options && typeof options === 'object' && ! useStickyRegex) {
        Object.assign(options, { useStickyRegex: false });
    }

    return Lexer.create(data, options).nextToken().value;
}

function lexerNextToken(data, options) {
    if (options && typeof options === 'object' && ! useStickyRegex) {
        Object.assign(options, { useStickyRegex: false });
    }

    return Lexer.create(data, options).nextToken();
}

function parserSetup(data, options) {
    if (options && typeof options === 'object' && ! useStickyRegex) {
        Object.assign(options, { useStickyRegex: false });
    }

    return Parser.parse(data, options);
}
