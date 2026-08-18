const path = require('path')
const baseConfig = require('./src/ambire-common/jest.config.js')

module.exports = {
  ...baseConfig,
  displayName: 'Ambire Extension Unit Tests',
  // The tsconfig path aliases, so tests can cover modules that import through them
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@ambire-common/(.*)$': path.join('<rootDir>', 'src/ambire-common/src/$1'),
    '^@common/(.*)$': path.join('<rootDir>', 'src/common/$1')
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
