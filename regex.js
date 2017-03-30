'use strict';

/**
 * Variables prefixed with an underscore are characters meant
 * to be in a character set but are unwrapped so that they
 * can be used in other character sets.
 *
 * Variables which are commented out and have // SPEC on the end
 * are regexes which were made according to the ECMAScript spec
 * but for performance reasons or just for readability, they have
 * their
 */

const er = require('escape-string-regexp');

const { keywords,
		punctuators } = require('./lib/constants/grammar');


const regexify =
    items => Object.keys(items)
            .sort((a, b) => b.length - a.length)
            .map(er)
            .join('|');

const KEYWORDS = regexify(keywords);
const PUNCTUATORS = regexify(punctuators);

const _WhiteSpace             = `\\t\\v\\f \\xA0`;
const WhiteSpace              = `[${_WhiteSpace}]`;
const _LineTerminator         = `\\n\\r`;
// const _LineTerminator         = `\\n\\r\\u2028\\u2029`;                    // SPEC
const LineTerminator          = `[${_LineTerminator}]`;
const LineTerminatorSequence  = `(?:\\r\\n|[\\r\\n])`;
// const LineTerminatorSequence  = `(?:[\\n\\u2028\\u2029]|\\r\\n|[\\r\\n])`; // SPEC

const Keyword    = `(?:${KEYWORDS})`;
const Punctuator = `(?:${PUNCTUATORS})`;

// Will turning on /u break any othr regex?
const _SourceCharacter = `\\s\\S`;
const SourceCharacter  = `[\\s\\S]`;

const ZWNJ             = '\\u200D';
const ZWJ              = '\\u200C';

const HexDigit             = `[0-9a-fA-F]`
const HexDigits            = `${HexDigit}+`;
const HexIntegerLiteral    = `(?:0x${HexDigits}|0X${HexDigits})`;

const OctalDigit           = `[0-7]`;
const OctalDigits          = `${OctalDigit}+`;
const OctalIntegerLiteral  = `(?:0[oO]${OctalDigits})`;
// const OctalIntegerLiteral  = `(?:0o${OctalDigits}|0O${OctalDigits})`;   // SPEC

const BinaryDigit          = `[01]`;
const BinaryDigits         = `${BinaryDigit}+`;
const BinaryIntegerLiteral = `(?:0[bB]${BinaryDigits})`;
// const BinaryIntegerLiteral = `(?:0b${BinaryDigits}|0B${BinaryDigits})`; // SPEC

const _DecimalDigit        = `0-9`;
const DecimalDigit         = `[${_DecimalDigit}]`;
const DecimalDigits        = `${DecimalDigit}+`;

const NonZeroDigit             = `[1-9]`;
const SignedInteger            = `(?:[-+]${DecimalDigits})`;
const ExponentIndicator        = `[eE]`;
const ExponentPart             = `${ExponentIndicator}${SignedInteger}`;

const DecimalIntegerLiteral    = `(?:0|${NonZeroDigit}(?:${DecimalDigits})?)`;
const DecimalLiteral           =
	`(?:${DecimalIntegerLiteral}\\.(?:${DecimalDigits})?|\\.${DecimalDigits}|${DecimalIntegerLiteral})(?:${ExponentPart})?`;

const Hex4Digits               = `${HexDigit}{4}`;
const UnicodeEscapeSequence    = `(?:u${Hex4Digits}|u\\{${Hex4Digits}\\})`;
const HexEscapeSequence        = `x${HexDigit}{2}`;
const SingleEscapeCharacter    = `['"\\\\bfnrtv]`;
const EscapeCharacter          = `['"\\\\bfnrtv0-9ux]`;
const NonEscapeCharacter       = `[^'"\\\\bfnrtv0-9ux${_LineTerminator}]`;
const CharacterEscapeSequence  = `(?:${SingleEscapeCharacter}|${NonEscapeCharacter})`;
const LineContinuation         = `\\\\${LineTerminatorSequence}`;

const EscapeSequence           = `(?:${CharacterEscapeSequence}|${HexEscapeSequence}|${UnicodeEscapeSequence})`;

const DoubleStringCharacter          = `(?:[^"\\\\${_LineTerminator}]|\\\\${EscapeSequence}|${LineContinuation})`;
const SingleStringCharacter          = `(?:[^'\\\\${_LineTerminator}]|\\\\${EscapeSequence}|${LineContinuation})`;
const DoubleStringCharacters         = `(?:\\\\${EscapeSequence}|${DoubleStringCharacter}|${LineContinuation})+`;
const SingleStringCharacters         = `(?:\\\\${EscapeSequence}|${SingleStringCharacter}|${LineContinuation})+`;

const TemplateCharacter        =
	`(?:\\$(?!\\{)|\\\\${EscapeSequence}|${LineContinuation}|${LineTerminatorSequence}|[^\`\\\\$${_LineTerminator}])`;

const TemplateCharacters       = `${TemplateCharacter}+`;
const TemplateTail             = `\\}(?:${TemplateCharacters})?\``;
const TemplateMiddle           = `\\}(?:${TemplateCharacters})\\$\\{`;
const TemplateSubstitutionTail = `(?:${TemplateMiddle}|${TemplateTail})`
const TemplateHead             = `\`(?:${TemplateCharacters})?\\$\\{`;
const NoSubstitutionTemplate   = `\`(?:${TemplateCharacters})?\``;
const Template                 = `(?:${NoSubstitutionTemplate}|${TemplateHead})`;

// NOTE: Might be better performance to have two separate
//       regexes for single and double quote string
// const StringLiteral   = `(?:("|')(?:${StringCharacters})?\\1)`;
const StringLiteral   = `(?:'(?:${SingleStringCharacters})?')|(?:"(?:${DoubleStringCharacters})?")`;

const NullLiteral     = `null`;
const BooleanLiteral  = `(?:true|false)`
const NumericLiteral  =
	`(?:${HexIntegerLiteral}|${OctalIntegerLiteral}|${BinaryIntegerLiteral}|${DecimalLiteral})`;

const Literal = `(?:${NullLiteral}|${BooleanLiteral}|${NumericLiteral}|${StringLiteral})`;

const ReservedWord    = `(?:${Keyword}|${NullLiteral}|${BooleanLiteral})`;

// FIXME: Doesn't support unicode
const IdentifierStart  = `(?:[$_a-zA-Z]|\\\\${UnicodeEscapeSequence})`;
const IdentifierPart   = `(?:[$_a-zA-Z0-9${ZWJ}${ZWNJ}]|\\\\${UnicodeEscapeSequence})`;
const IdentifierName   = `(?:${IdentifierStart}${IdentifierPart}*)`;

const all = [
	Punctuator,
	Literal,
	ReservedWord,
	IdentifierName,
].join('|')

exports.all            = new RegExp(`^(?:${all})`,            'u');
exports.Punctuator     = new RegExp(`^(?:${Punctuator})`,     '');
exports.Literal        = new RegExp(`^(?:${Literal})`,        'u');
exports.StringLiteral  = new RegExp(`^(?:${StringLiteral})`,  'u');
exports.NumericLiteral = new RegExp(`^(?:${NumericLiteral})`, 'u');
exports.Template       = new RegExp(`^(?:${Template})`,       'u');
exports.ReservedWord   = new RegExp(`^(?:${ReservedWord})`,   'u');
exports.IdentifierName = new RegExp(`^(?:${IdentifierName})`, 'u');
exports.IdentifierPart = new RegExp(`^(?:${IdentifierPart})`, 'u');

const template =
`'use strict';

/* Generated from ./regex.js */

exports.Punctuator      = ${exports.Punctuator};

exports.NumericLiteral  = ${exports.NumericLiteral};

exports.StringLiteral   = ${exports.StringLiteral};

exports.ReservedWord    = ${exports.ReservedWord};

exports.IdentifierName  = ${exports.IdentifierName};

`;

// exports.Template        = ${exports.Template};

console.log(template)
