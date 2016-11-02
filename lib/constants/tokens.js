'use strict';

let a = 0;
const id = () => a++;

exports.TokenNumericLiteral = id();
exports.TokenStringLiteral  = id();
exports.TokenIdentifier     = id();
exports.TokenKeyword        = id();
exports.TokenPunctuator     = id();
