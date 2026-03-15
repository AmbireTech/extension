// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles']

// Redirect scrypt-js and pbkdf2 to native mobile shims (react-native-quick-crypto)
// so that ambire-common's ScryptAdapter uses the C++ implementation instead of pure-JS.
// The Babel module-resolver alias doesn't reliably apply inside ambire-common,
// so we enforce it at the Metro resolver level which is authoritative.
const shimRedirects = {
  'scrypt-js': path.resolve(__dirname, 'src/mobile/shims/scrypt-js.ts'),
  pbkdf2: path.resolve(__dirname, 'src/mobile/shims/pbkdf2.ts'),
  crypto: require.resolve('react-native-quick-crypto')
}

const originalResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (shimRedirects[moduleName]) {
    return {
      filePath: shimRedirects[moduleName],
      type: 'sourceFile'
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
