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
    // reach the same real implementations the shims delegate to. viem hides
    // these paths behind an exports map, so they are mapped by file path rather
    // than left to the resolver.
    '^@viem-original/getAddress$': '<rootDir>/node_modules/viem/_cjs/utils/address/getAddress.js',
    '^@viem-original/lru$': '<rootDir>/node_modules/viem/_cjs/utils/lru.js',
    '^@viem-original/address$': '<rootDir>/node_modules/viem/_cjs/errors/address.js',
    '^@viem-original/decodeFunctionResult$':
      '<rootDir>/node_modules/viem/_cjs/utils/abi/decodeFunctionResult.js',
    '^@viem-original/encodeFunctionData$':
      '<rootDir>/node_modules/viem/_cjs/utils/abi/encodeFunctionData.js'
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
  setupFiles: [path.join('<rootDir>', 'jest.setup.js')]
}
