'use strict';

module.exports = {
  server: ['coverage/lcov-report'],
  files: ['coverage/lcov-report/**/*.{html,css}'],
  port: 4000,
  ui: {
    port: 4001
  },
  reloadDelay: 500,
  reloadDebounce: 500,
  open: false,
  notify: false
};
