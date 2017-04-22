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

const { keywords } = require('./lib/constants/grammar');

const regexify =
    items => Object.keys(items)
            .sort((a, b) => b.length - a.length)
            .map(er)
            .join('|');

const punctuators = {
  '{':    true,
  '(':    true,
  ')':    true,
  '[':    true,
  ']':    true,
  '.':    true,
  '...':  true,
  ';':    true,
  ',':    true,
  '<':    true,
  '>':    true,
  '<=':   true,
  '>=':   true,
  '==':   true,
  '!=':   true,
  '===':  true,
  '!==':  true,
  '+':    true,
  '-':    true,
  '*':    true,
  '**':   true,
  '%':    true,
  '++':   true,
  '--':   true,
  '<<':   true,
  '>>':   true,
  '>>>':  true,
  '&':    true,
  '|':    true,
  '^':    true,
  '!':    true,
  '~':    true,
  '&&':   true,
  '||':   true,
  '?':    true,
  ':':    true,
  '=':    true,
  '+=':   true,
  '-=':   true,
  '*=':   true,
  '**=':  true,
  '%=':   true,
  '<<=':  true,
  '>>=':  true,
  '>>>=': true,
  '&=':   true,
  '|=':   true,
  '^=':   true,
  '=>':   true,
  '/':    true,
  '/=':   true,
  '}':    true,
};

const KEYWORDS = regexify(keywords);
const PUNCTUATORS = regexify(punctuators);

const _WhiteSpace              = `\\t\\v\\f \\xA0`;
const WhiteSpace               = `[${_WhiteSpace}]`;
const _LineTerminator          = `\\n\\r`;
// const _LineTerminator         = `\\n\\r\\u2028\\u2029`;                    // SPEC
const LineTerminator           = `[${_LineTerminator}]`;
const LineTerminatorSequence   = `(?:\\r\\n|[\\r\\n])`;
// const LineTerminatorSequence  = `(?:[\\n\\u2028\\u2029]|\\r\\n|[\\r\\n])`; // SPEC

const Keyword                  = `(?:${KEYWORDS})`;
const Punctuator               = `(?:${PUNCTUATORS})`;

// Will turning on /u break any othr regex?
const _SourceCharacter         = `\\s\\S`;
const SourceCharacter          = `[\\s\\S]`;

const ZWNJ                     = '\\u200D';
const ZWJ                      = '\\u200C';

const HexDigit                 = `[0-9a-fA-F]`
const HexDigits                = `${HexDigit}+`;
const HexIntegerLiteral        = `(?:0x${HexDigits}|0X${HexDigits})`;

const OctalDigit               = `[0-7]`;
const OctalDigits              = `${OctalDigit}+`;
const OctalIntegerLiteral      = `(?:0[oO]${OctalDigits})`;
// const OctalIntegerLiteral   = `(?:0o${OctalDigits}|0O${OctalDigits})`;   // SPEC

const BinaryDigit              = `[01]`;
const BinaryDigits             = `${BinaryDigit}+`;
const BinaryIntegerLiteral     = `(?:0[bB]${BinaryDigits})`;
// const BinaryIntegerLiteral  = `(?:0b${BinaryDigits}|0B${BinaryDigits})`; // SPEC

const _DecimalDigit            = `0-9`;
const DecimalDigit             = `[${_DecimalDigit}]`;
const DecimalDigits            = `${DecimalDigit}+`;

const NonZeroDigit             = `[1-9]`;
const SignedInteger            = `(?:[-+]${DecimalDigits})`;
const ExponentIndicator        = `[eE]`;
const ExponentPart             = `${ExponentIndicator}${SignedInteger}`;

const DecimalIntegerLiteral    = `(?:0|${NonZeroDigit}(?:${DecimalDigits})?)`;
const DecimalLiteral           = `(?:${DecimalIntegerLiteral}\\.(?:${DecimalDigits})?|\\.${DecimalDigits}|${DecimalIntegerLiteral})(?:${ExponentPart})?`;

const Hex4Digits               = `${HexDigit}{4}`;
const UnicodeEscapeSequence    = `(?:u${Hex4Digits}|u\\{${Hex4Digits}\\})`;
const HexEscapeSequence        = `x${HexDigit}{2}`;
const SingleEscapeCharacter    = `['"\\\\bfnrtv]`;
const EscapeCharacter          = `['"\\\\bfnrtv0-9ux]`;
const NonEscapeCharacter       = `[^'"\\\\bfnrtv0-9ux${_LineTerminator}]`;
const CharacterEscapeSequence  = `(?:${SingleEscapeCharacter}|${NonEscapeCharacter})`;
const LineContinuation         = `\\\\${LineTerminatorSequence}`;

const EscapeSequence           = `(?:${CharacterEscapeSequence}|${HexEscapeSequence}|${UnicodeEscapeSequence})`;

const DoubleStringCharacter    = `(?:[^"\\\\${_LineTerminator}]|\\\\${EscapeSequence}|${LineContinuation})`;
const SingleStringCharacter    = `(?:[^'\\\\${_LineTerminator}]|\\\\${EscapeSequence}|${LineContinuation})`;
const DoubleStringCharacters   = `(?:\\\\${EscapeSequence}|${DoubleStringCharacter}|${LineContinuation})+`;
const SingleStringCharacters   = `(?:\\\\${EscapeSequence}|${SingleStringCharacter}|${LineContinuation})+`;

const StringLiteral            = `(?:'(?:${SingleStringCharacters})?')|(?:"(?:${DoubleStringCharacters})?")`;
const StringSingleLiteral      = `(?:'(?:${SingleStringCharacters})?')`;
const StringDoubleLiteral      = `(?:"(?:${DoubleStringCharacters})?")`;

const NullLiteral              = `(?:null)`;
const BooleanLiteral           = `(?:true|false)`
const NumericLiteral           = `(?:${HexIntegerLiteral}|${OctalIntegerLiteral}|${BinaryIntegerLiteral}|${DecimalLiteral})`;

const Literal                  = `(?:${NullLiteral}|${BooleanLiteral}|${NumericLiteral}|${StringLiteral})`;

const ReservedWord             = `(?:${Keyword}|${NullLiteral}|${BooleanLiteral})`;

// FIXME: Doesn't support unicode
const IdentifierStart          = `(?:[$_a-zA-Z]|\\\\${UnicodeEscapeSequence})`;
const IdentifierPart           = `(?:[$_a-zA-Z0-9${ZWJ}${ZWNJ}]|\\\\${UnicodeEscapeSequence})`;
const IdentifierName           = `(?:${IdentifierStart}${IdentifierPart}*)`;

const TemplateSourceCharacter  = `(?:\\\\${EscapeSequence}|${LineContinuation}|${LineTerminatorSequence}|\\$(?!\\{)|[^$\`\\\\${_LineTerminator}])`;
const TemplateCharacters       = `(?:${TemplateSourceCharacter})*?`;
const TemplateHead             = `\`${TemplateCharacters}\\$\\{`;
const TemplateMiddle           = `\\}${TemplateCharacters}\\$\\{`;
const TemplateTail             = `\\}${TemplateCharacters}\``;
const TemplateNoSub            = `\`${TemplateCharacters}\``;

const wrap = (source, flags) => new RegExp(`^(?:${source})`, flags);

exports.Punctuator     = wrap(Punctuator,      '');
exports.Literal        = wrap(Literal,        'u');
exports.StringLiteral  = wrap(StringLiteral,  'u');
exports.NumericLiteral = wrap(NumericLiteral, 'u');
exports.BooleanLiteral = wrap(BooleanLiteral,  '');
exports.NullLiteral    = wrap(NullLiteral,     '');
exports.TemplateHead   = wrap(TemplateHead,   'u');
exports.TemplateMiddle = wrap(TemplateMiddle, 'u');
exports.TemplateTail   = wrap(TemplateTail,   'u');
exports.TemplateNoSub  = wrap(TemplateNoSub,  'u');
exports.ReservedWord   = wrap(ReservedWord,   'u');
exports.Identifier     = wrap(IdentifierName, 'u');
exports.IdentifierPart = wrap(IdentifierPart, 'u');

const template =
`'use strict';

/* Generated from ./regex.js */

exports.Punctuator      = ${exports.Punctuator};

exports.NumericLiteral  = ${exports.NumericLiteral};

exports.StringLiteral   = ${exports.StringLiteral};

exports.NullLiteral     = ${exports.NullLiteral};

exports.BooleanLiteral  = ${exports.BooleanLiteral};

exports.ReservedWord    = ${exports.ReservedWord};

exports.Identifier      = ${exports.Identifier};

exports.TemplateHead    = ${exports.TemplateHead};

exports.TemplateMiddle  = ${exports.TemplateMiddle};

exports.TemplateTail    = ${exports.TemplateTail};

exports.TemplateNoSub   = ${exports.TemplateNoSub};
`;

console.log(template);
