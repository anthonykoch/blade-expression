'use strict';

/* Generated from ./regex.js */

exports.Punctuator      = /(?:>>>=|>>>|===|!==|\.\.\.|\*\*=|<<=|>>=|\*\*|\+\+|--|<<|>>|&&|>=|\+=|-=|\*=|==|%=|!=|\/=|<=|&=|\|=|\^=|=>|\|\||\||\^|!|~|\]|\.|\?|:|=|\{|;|\+|-|\*|,|%|<|>|\)|\[|\(|\/|&|\})/;

exports.NumericLiteral  = /(?:(?:0x[0-9a-fA-F]+|0X[0-9a-fA-F]+)|(?:0[oO][0-7]+)|(?:0[bB][01]+)|(?:(?:0|[1-9](?:[0-9]+)?)\.(?:[0-9]+)?|\.[0-9]+|(?:0|[1-9](?:[0-9]+)?))(?:[eE](?:[-+][0-9]+))?)/u;

exports.StringLiteral   = /(?:'(?:(?:\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|(?:[^'\\\n\r]|\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|\\(?:\r\n|[\r\n]))|\\(?:\r\n|[\r\n]))+)?')|(?:"(?:(?:\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|(?:[^"\\\n\r]|\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|\\(?:\r\n|[\r\n]))|\\(?:\r\n|[\r\n]))+)?")/u;

// exports.Template        = /(?:`(?:(?:\$(?!\{)|\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|\\(?:\r\n|[\r\n])|(?:\r\n|[\r\n])|[^`\\$\n\r])+)?`|`(?:(?:\$(?!\{)|\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|\\(?:\r\n|[\r\n])|(?:\r\n|[\r\n])|[^`\\$\n\r])+)?\$\{)/u;

exports.ReservedWord    = /(?:(?:instanceof|function|debugger|continue|default|extends|finally|delete|export|import|typeof|return|switch|const|throw|while|yield|catch|super|class|break|case|void|this|with|else|var|new|for|try|if|do|in)|null|(?:true|false))/u;

exports.IdentifierName  = /(?:(?:[$_a-zA-Z]|\\(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))(?:[$_a-zA-Z0-9\u200C\u200D]|\\(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))*)/u;
