module.exports = {
  name: 'web',
  displayName: 'Browser Extension',
  preset: 'jest-puppeteer',
  // Longer timeout than the default one needed for heavier dapps, like https://myetherwallet.com,
  // otherwise, tests fail because the default timeout gets reached.
  testTimeout: 30000,
  transformIgnorePatterns: [
    // Include the "ambire-common" package files in the ignore, since these
    // files are not compiled and written in TypeScript. So they must be
    // included in the compile process.
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|ambire-common)'
  ]
}
