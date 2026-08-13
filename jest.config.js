const path = require('path')
const baseConfig = require('./src/ambire-common/jest.config.js')

module.exports = {
  ...baseConfig,
  displayName: 'Ambire Extension Unit Tests',
  // Mirrors the `paths` in tsconfig.json. The base config only knows ambire-common's
  // own aliases, so without these a test cannot import anything by its `@common/...`
  // path even though the source it tests does.
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@ambire-common/(.*)$': '<rootDir>/src/ambire-common/src/$1',
    '^@ambire-common-v1/(.*)$': '<rootDir>/src/ambire-common/v1/$1',
    '^@contracts/(.*)$': '<rootDir>/src/ambire-common/contracts/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@mobile/(.*)$': '<rootDir>/src/mobile/$1',
    '^@web/(.*)$': '<rootDir>/src/web/$1',
    '^@benzin/(.*)$': '<rootDir>/src/benzin/$1',
    '^@legends/(.*)$': '<rootDir>/src/legends/$1',
    // The specifiers metro.config.js maps for the mobile shims, so their tests
    // reach the same real implementations the shims delegate to. Both packages
    // hide these paths behind an exports map, so they are mapped by file path
    // rather than left to the resolver.
    //
    // Metro takes the errors from lib.esm and this takes them from lib.commonjs,
    // because node_modules is not transformed here. Nothing observable differs:
    // ethers' `isError` compares `error.code`, not the error's identity.
    '^@viem-original/toHex$': '<rootDir>/node_modules/viem/_cjs/utils/encoding/toHex.js',
    '^@viem-original/toBytes$': '<rootDir>/node_modules/viem/_cjs/utils/encoding/toBytes.js',
    '^@ethers-original/errors$': '<rootDir>/node_modules/ethers/lib.commonjs/utils/errors.js',
    '^@base64-js-original$': '<rootDir>/node_modules/base64-js/index.js',
    // Test-only, with no counterpart in metro.config.js: the module the data
    // shim replaces outright, kept reachable so the shim can be diffed against
    // the behaviour it has to reproduce.
    '^@ethers-original/data$': '<rootDir>/node_modules/ethers/lib.commonjs/utils/data.js'
  },
  testPathIgnorePatterns: [
    path.join('<rootDir>', 'e2e-playwright-tests/'), // E2E tests, handled by another configuration
    path.join('<rootDir>', 'src/ambire-common/'), // Tests for the ambire-common library, handled by another configuration
    path.join('<rootDir>', 'node_modules/'),
    // Mobile builds
    path.join('<rootDir>', 'android/'),
    path.join('<rootDir>', 'ios/'),
    // Extension, benzin and legends builds
    path.join('<rootDir>', 'build/'),
    // Safari extension xcode project
    path.join('<rootDir>', 'safari-extension/'),
    // Misc
    path.join('<rootDir>', '\\.[^/]+'), // Matches any directory starting with a dot
    path.join('<rootDir>', 'recorder/'), // E2E tests video recorder files
    path.join('<rootDir>', 'vendor/') // Ruby
  ],
  setupFiles: []
}
