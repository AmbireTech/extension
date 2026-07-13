const ambireCommonConfig = require('./src/ambire-common/eslint.config.js')

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: [
      // ambire-common ignores in its eslint.config.js are relative to that folder; when
      // spread here they resolve from repo root, so this makes sure all is ignored across both repos
      '**/dist/**',
      '**/babel_cache/**',
      '**/artifacts/**',
      '**/contracts/**',
      '**/coverage/**',
      '**/node_modules/**',
      'ios/**',
      'android/**',
      'safari-extension/**',
      'build/**',
      'recorder/**',
      '.expo/**',
      '.eslintrc.js',
      'eslint.config.js',
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
        projectService: {
          defaultProject: './tsconfig.json'
        }
      },
      globals: {
        browser: 'readonly',
        node: 'readonly',
        jest: 'readonly',
        process: 'readonly',
        chrome: 'readonly',
        injectWeb3: 'readonly',
        __dirname: 'readonly',
        chromeTargetConfig: 'writable',
        firefoxTargetConfig: 'writable',
        Web3: 'readonly'
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
  // The extension UI must import only TYPES from ambire-common controllers and
  // heavy business-logic libs - they run in the background service worker. A plain value import
  // drags the whole module (and its transitive deps) into the UI bundle.
  {
    files: ['src/common/**/*.{ts,tsx}', 'src/web/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: [
                '@ambire-common/controllers/*',
                '@ambire-common/libs/humanizer',
                '@ambire-common/libs/humanizer/*'
              ],
              // permits `import type`, warns on value imports.
              allowTypeImports: true,
              message:
                'Import only types from ambire-common controllers and heavy modules in the UI (use `import type`). Such imports bundle background-only code into the extension UI.'
            }
          ]
        }
      ]
    }
  },
  // After ambire-common spread so root rule overrides stay; disables formatting rules vs Prettier.
  require('eslint-config-prettier')
]
