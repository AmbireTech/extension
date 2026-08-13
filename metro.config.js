// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')
const { getBundleModeMetroConfig } = require('react-native-worklets/bundleMode')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Worklets Bundle Mode loads the whole Metro bundle into every worklet runtime, which is
// what makes `require`, and therefore libraries usable inside a worklet. Reanimated's UI
// runtime is the one that benefits here — the app runs no worklets of its own.
getBundleModeMetroConfig(config)

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

// The controller pipeline derives every controller's identity from
// `this.constructor.name` (eventEmitter.ts `get name()`), and criticalControllers,
// serializeControllerForUI and the registry lookup all key off those exact strings.
// React Native's Babel preset downlevels `class MainController {}` into a plain
// `function MainController()` inside an `_inherits` wrapper, so by the time terser
// runs there is no class left and `keep_classnames` alone does nothing — the
// constructor is mangled to a single letter and every controller loses its identity,
// in release builds only, silently. `keep_fnames` is what actually protects it;
// `keep_classnames` stays for the modules Babel does leave as real classes.
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    ...config.transformer.minifierConfig.mangle,
    keep_classnames: true,
    keep_fnames: true
  },
  compress: {
    ...config.transformer.minifierConfig.compress,
    keep_classnames: true,
    keep_fnames: true
  }
}

// Redirect scrypt-js and pbkdf2 to native mobile shims (react-native-quick-crypto)
// so that ambire-common's ScryptAdapter uses the C++ implementation instead of pure-JS.
// The Babel module-resolver alias doesn't reliably apply inside ambire-common,
// so we enforce it at the Metro resolver level which is authoritative.
const shimRedirects = {
  'scrypt-js': path.resolve(__dirname, 'src/mobile/shims/scrypt-js.ts'),
  pbkdf2: path.resolve(__dirname, 'src/mobile/shims/pbkdf2.ts'),
  'eth-crypto': path.resolve(__dirname, 'src/mobile/shims/eth-crypto.ts'),
  // Keyed on the package name rather than a resolved file so that every consumer
  // is covered at once. React Native reaches base64-js from five places
  // (binaryToBase64, FileReader, XMLHttpRequest and both WebSocket modules), and
  // the two that matter for the portfolio — the request body encode and the
  // response blob decode — are on opposite sides of the fetch.
  'base64-js': path.resolve(__dirname, 'src/mobile/shims/base64-js.ts')
}

// Swap two of viem's own modules for Rust-backed shims. Redirecting these
// modules rather than the `viem` package entry means viem's internals get the
// native versions too, since they import them by relative path, and it keeps
// boot from having to evaluate the whole viem barrel just to override two keys.
//
// viem ships a `_esm` and a `_cjs` build and which one Metro picks depends on
// package-exports conditions, so both are registered. Only the resolved build is
// ever reached; the other entry is dead weight in a plain object.
// Paths are relative to a viem build root. The shim for each one lives at
// `src/mobile/shims/viem/<basename>.ts` and reaches the module it replaces
// through `@viem-original/<basename>`.
const viemNativeModules = [
  'utils/abi/decodeFunctionResult',
  'utils/abi/encodeFunctionData',
  'utils/address/getAddress'
]
const viemBuildFlavors = ['_esm', '_cjs']

const viemModuleRedirects = {}
// The real implementations, reached from the shims through a specifier that no
// redirect applies to, which is what stops a shim from resolving to itself.
const shimOriginals = {}

const registerViemOriginal = (modulePath) => {
  const moduleName = path.basename(modulePath)
  shimOriginals[`@viem-original/${moduleName}`] = path.resolve(
    __dirname,
    `node_modules/viem/_cjs/${modulePath}.js`
  )

  return moduleName
}

viemNativeModules.forEach((modulePath) => {
  const moduleName = registerViemOriginal(modulePath)

  viemBuildFlavors.forEach((flavor) => {
    const viemFilePath = path.resolve(__dirname, `node_modules/viem/${flavor}/${modulePath}.js`)
    viemModuleRedirects[viemFilePath] = path.resolve(
      __dirname,
      `src/mobile/shims/viem/${moduleName}.ts`
    )
  })
})

// Collaborators of the shims that are not themselves replaced. They are
// registered as originals so a shim reaches them without the redirect map
// applying to viem's own imports of them. isAddress and lru back the getAddress
// shim; toHex and toBytes back the ethers `utils/data` shim, which falls back to
// viem's hex codec for the sizes the Rust crate is not worth crossing into.
;['utils/address/isAddress', 'utils/lru', 'utils/encoding/toHex', 'utils/encoding/toBytes'].forEach(
  registerViemOriginal
)

shimOriginals['@base64-js-original'] = path.resolve(__dirname, 'node_modules/base64-js/index.js')

// Swap ethers' `utils/data` for a shim that replaces its per-byte hex loops —
// a `substring` + `parseInt` per byte and a validation regex per call — with a
// byte-to-hex table for small values and the Rust crate for large ones. The
// shim is self-contained (no viem dependency) so ethers only ever crosses into
// react-native-ambire-crypto, never into viem's own hex codec.
//
// Both builds are registered. ethers' exports map is `{ import, default }`, and
// the condition Metro matches it against depends on how the importing module
// spelled the import: `matchSubpathFromExportsLike` adds `import` when the
// requester used ESM syntax and `require` otherwise, on top of
// `unstable_conditionNames` and the platform conditions. So `import ... from
// 'ethers'` resolves to lib.esm and a `require('ethers')` resolves to
// lib.commonjs, and keying only one of them is what made this redirect silently
// no-op before — the app imports ethers as ESM and got the unshimmed lib.esm
// copy.
const ETHERS_BUILD_FLAVORS = ['lib.esm', 'lib.commonjs']

// The flavor the app actually resolves, and so the one the shim reads its errors
// from. Serving both flavors' `data.js` from a single shim means the errors it
// throws can come from the other flavor's module, which is harmless: ethers'
// `isError` compares `error.code`, it does not check the error's identity.
// Pinning this to one flavor just keeps a second copy of ethers' error module
// out of the bundle.
const ETHERS_ERRORS_FLAVOR = 'lib.esm'

shimOriginals['@ethers-original/errors'] = path.resolve(
  __dirname,
  `node_modules/ethers/${ETHERS_ERRORS_FLAVOR}/utils/errors.js`
)

const ethersModuleRedirects = {}

ETHERS_BUILD_FLAVORS.forEach((flavor) => {
  const ethersFilePath = path.resolve(__dirname, `node_modules/ethers/${flavor}/utils/data.js`)
  ethersModuleRedirects[ethersFilePath] = path.resolve(__dirname, 'src/mobile/shims/ethers/data.ts')
})

// Redirect node built-ins to browserified/native versions
const nodeCoreRedirects = {
  crypto: 'react-native-quick-crypto',
  stream: 'readable-stream',
  buffer: 'buffer',
  http: 'stream-http',
  https: 'https-browserify',
  zlib: 'browserify-zlib'
}

// Modules that must be swapped out but are imported by relative path from inside
// ambire-common, so there is no specifier to key on. Matched on the resolved file
// instead. Colibri runs a WebAssembly verifier and Hermes has no WebAssembly.
const resolvedFileRedirects = {
  [path.resolve(__dirname, 'src/ambire-common/src/services/provider/colibri.ts')]: path.resolve(
    __dirname,
    'src/mobile/shims/colibri.ts'
  ),
  ...viemModuleRedirects,
  ...ethersModuleRedirects
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
  // Returned before the redirect map below runs, so the shims can reach the viem
  // implementations they replace.
  if (shimOriginals[moduleName]) {
    return { filePath: shimOriginals[moduleName], type: 'sourceFile' }
  }

  const resolution = originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform)

  const redirectedFilePath = resolution?.filePath && resolvedFileRedirects[resolution.filePath]
  if (redirectedFilePath) return { filePath: redirectedFilePath, type: 'sourceFile' }

  return resolution
}

module.exports = config
