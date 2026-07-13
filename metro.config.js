// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles']

// PERF (cold start): defer module evaluation until first use instead of running
// the entire ~16MB bundle's top-level code eagerly at boot. Metro's
// inlineRequires only rewrites `const x = require(...)` (assigned) requires —
// bare side-effect imports like `import './shim'` in index.js are left in place
// and still run eagerly in order, so the polyfill bootstrap ordering is
// preserved. If a module is relied on for an import-time side effect via a
// *named* binding, add it to `getTransformOptions.transform.nonInlinedRequires`.
// This shrinks boot eval time, not the bundle size.
const baseGetTransformOptions = config.transformer.getTransformOptions
config.transformer.getTransformOptions = async (...args) => {
  const base = await baseGetTransformOptions(...args)
  return {
    ...base,
    transform: {
      ...base.transform,
      inlineRequires: true
    }
  }
}

// Redirect scrypt-js and pbkdf2 to native mobile shims (react-native-quick-crypto)
// so that ambire-common's ScryptAdapter uses the C++ implementation instead of pure-JS.
// The Babel module-resolver alias doesn't reliably apply inside ambire-common,
// so we enforce it at the Metro resolver level which is authoritative.
const shimRedirects = {
  'scrypt-js': path.resolve(__dirname, 'src/mobile/shims/scrypt-js.ts'),
  pbkdf2: path.resolve(__dirname, 'src/mobile/shims/pbkdf2.ts'),
  'eth-crypto': path.resolve(__dirname, 'src/mobile/shims/eth-crypto.ts')
}

// Redirect node built-ins to browserified/native versions
const nodeCoreRedirects = {
  crypto: 'react-native-quick-crypto',
  stream: 'readable-stream',
  buffer: 'buffer',
  http: 'stream-http',
  https: 'https-browserify',
  zlib: 'browserify-zlib'
}

const originalResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (nodeCoreRedirects[moduleName]) {
    return context.resolveRequest(context, nodeCoreRedirects[moduleName], platform)
  }
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
