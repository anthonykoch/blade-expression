'use strict';

/* Generated from ./regex.js */

exports.test = /./u;

exports.Punctuator      = /^(?:(?:>>>=|>>>|===|!==|\.\.\.|\*\*=|<<=|>>=|\*\*|\+\+|--|<<|>>|&&|>=|\+=|-=|\*=|==|%=|!=|\/=|<=|&=|\|=|\^=|=>|\|\||\||\^|!|~|\]|\.|\?|:|=|\{|;|\+|-|\*|,|%|<|>|\)|\[|\(|\/|&|\}))/;

exports.NumericLiteral  = /^(?:(?:(?:0x[0-9a-fA-F]+|0X[0-9a-fA-F]+)|(?:0[oO][0-7]+)|(?:0[bB][01]+)|(?:(?:0|[1-9](?:[0-9]+)?)\.(?:[0-9]+)?|\.[0-9]+|(?:0|[1-9](?:[0-9]+)?))(?:[eE](?:[-+][0-9]+))?))/u;

exports.StringLiteral   = /^(?:(?:'(?:(?:\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|(?:[^'\\\n\r]|\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|\\(?:\r\n|[\r\n]))|\\(?:\r\n|[\r\n]))+)?')|(?:"(?:(?:\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|(?:[^"\\\n\r]|\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|\\(?:\r\n|[\r\n]))|\\(?:\r\n|[\r\n]))+)?"))/u;

exports.NullLiteral     = /^(?:(?:null))/;

exports.BooleanLiteral  = /^(?:(?:true|false))/;

exports.ReservedWord    = /^(?:(?:(?:instanceof|continue|function|debugger|default|extends|finally|import|export|typeof|return|switch|delete|const|catch|throw|while|break|yield|super|class|this|with|case|void|else|let|for|var|new|try|if|do|in)|(?:null)|(?:true|false)))/u;

exports.IdentifierName  = /^(?:(?:(?:[$_a-zA-Z]|\\(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))(?:[$_a-zA-Z0-9\u200C\u200D]|\\(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))*))/u;

exports.TemplateHead    = /^(?:`(?:(?:\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|\\(?:\r\n|[\r\n])|(?:\r\n|[\r\n])|\$(?!\{)|[^$`\\\n\r]))*?\$\{)/u;

exports.TemplateMiddle  = /^(?:\}(?:(?:\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|\\(?:\r\n|[\r\n])|(?:\r\n|[\r\n])|\$(?!\{)|[^$`\\\n\r]))*?\$\{)/u;

exports.TemplateTail    = /^(?:\}(?:(?:\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|\\(?:\r\n|[\r\n])|(?:\r\n|[\r\n])|\$(?!\{)|[^$`\\\n\r]))*?`)/u;

exports.TemplateNoSub   = /^(?:`(?:(?:\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|\\(?:\r\n|[\r\n])|(?:\r\n|[\r\n])|\$(?!\{)|[^$`\\\n\r]))*?`)/u;



