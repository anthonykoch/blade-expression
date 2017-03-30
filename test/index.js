'use strict';

const path = require('path');

const glob = require('glob');

require('./cases');

glob
    .sync('./**/*.spec.js')
    .forEach(file => {
        require(path.resolve(file));
    });
