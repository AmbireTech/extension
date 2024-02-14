module.exports = {
  extends: ['./node_modules/ambire-common/.eslintrc.js', '@tsconfig/react-native/tsconfig.json'],
  rules: {
    'import/extensions': 'off',
    'class-methods-use-this': 'off',
    'no-nested-ternary': 'off',
    'prefer-promise-reject-errors': 'off',
    'no-underscore-dangle': 'off'
  },
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    project: './tsconfig.json'
  },
  globals: {
    process: 'readonly',
    chrome: 'readonly',
    injectWeb3: 'readonly',
    browser: 'readonly',
    __dirname: 'readonly',
    chromeTargetConfig: 'writable',
    firefoxTargetConfig: 'writable',
    Web3: true
  }
}
