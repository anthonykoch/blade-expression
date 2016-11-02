'use strict';

const path = require('path');
const glob = require('glob');

glob
	.sync('./**/*.spec.js')
	.forEach(function (file) {
		require(path.resolve(file));
	});
