const ambireCommonConfig = require('./src/ambire-common/eslint.config.js')

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      'ios/**',
      'android/**',
      'safari-extension/**',
      'build/**',
      'recorder/**',
      'coverage/**',
      '.expo/**',
      '.eslintrc.js',
      '.yarnclean',
      '.tmp/**',
      '.vscode/**',
      '.babel_cache/**',
      'yarn.lock',
      'yarn-error.log',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js'
    ]
  },
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
  },
  // After ambire-common spread so root rule overrides stay; disables formatting rules vs Prettier.
  require('eslint-config-prettier')
]
