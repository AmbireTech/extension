const ambireCommonConfig = require('./src/ambire-common/eslint.config.js')

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  ...ambireCommonConfig,
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json'
      },
      globals: {
        browser: 'readonly',
        node: true,
        jest: true,
        process: 'readonly',
        chrome: 'readonly',
        injectWeb3: 'readonly',
        __dirname: 'readonly',
        chromeTargetConfig: 'writable',
        firefoxTargetConfig: 'writable',
        Web3: true
      }
    },
    rules: {
      'import/extensions': 'off',
      'class-methods-use-this': 'off',
      'no-nested-ternary': 'off',
      'prefer-promise-reject-errors': 'off',
      'no-underscore-dangle': 'off',
      'react/jsx-key': 'error'
    }
  }
]
