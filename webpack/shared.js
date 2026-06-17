/* eslint-disable @typescript-eslint/no-require-imports */
// The 'react-native-dotenv' package doesn't work in the NodeJS context (and
// with commonjs imports), so alternatively, use 'dotenv' package to load the
// environment variables from the .env file.
require('dotenv').config()

const createExpoWebpackConfigAsync = require('@expo/webpack-config')
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { isWebkit, isGecko } = require('./env')

// Inside webpack/, __dirname points at the webpack/ folder, so resolve repo-root
// relative paths against ROOT_DIR (one level up).
const ROOT_DIR = path.resolve(__dirname, '..')

// Shared across extension, benzin and legends builds: treat .cjs files as
// regular JS (not ESM). Some dependencies (e.g. @metamask/eth-sig-util v7+/v8+)
// ship .cjs files with "exports" fields; in multi-entry builds Webpack 5 can
// otherwise try to emit the same .cjs into multiple chunks ("Multiple chunks
// emit assets to the same filename").
const CJS_RULE = {
  test: /\.cjs$/,
  type: 'javascript/auto'
}

// Apply the shared Terser hardening used by every production build.
// 1) compress.pure_getters + passes:3 for tighter output.
// 2) ascii_only + comments:false for deterministic, comment-free output.
// 3) mangle:false — required for bit-for-bit deterministic Firefox builds and
//    to avoid GridPlus SDK EIP-712 signing breakage on Webkit prod (Linux).
// 4) keep_classnames so `this.constructor.name` logic keeps working.
function hardenTerser(config) {
  const terserPlugin = config.optimization.minimizer?.find(
    (minimizer) => minimizer.constructor.name === 'TerserPlugin'
  )
  if (!terserPlugin) return

  const terserRealOptions = terserPlugin.options.minimizer?.options
  if (!terserRealOptions) return

  terserRealOptions.compress = {
    ...(terserRealOptions.compress || {}),
    pure_getters: true,
    passes: 3
  }

  terserRealOptions.output = {
    ...(terserRealOptions.output || {}),
    ascii_only: true,
    comments: false
  }

  terserRealOptions.mangle = false
  terserRealOptions.keep_classnames = true
}

// Remove a plugin that @expo/webpack-config adds by default, matched by its
// constructor name. We re-implement several of these (copy/clean/html/manifest)
// ourselves, so the Expo defaults have to go first.
function removeExpoPlugin(config, pluginName) {
  const index = config.plugins.findIndex((plugin) => plugin.constructor.name === pluginName)
  if (index !== -1) config.plugins.splice(index, 1)
}

// Build the Expo base config and apply everything shared by all three web
// builds (extension, benzin, legends). Returns the config plus the pruned Expo
// plugin snapshot the per-environment modules spread into their plugin arrays.
async function createBaseConfig(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv)
  const enableLavaMoat = config.mode === 'production' && isWebkit

  config.resolve.alias['@ledgerhq/devices/hid-framing'] = '@ledgerhq/devices/lib/hid-framing'
  config.resolve.alias.dns = 'dns-js'

  // The files in the /web directory should be transpiled not just copied
  removeExpoPlugin(config, 'CopyPlugin')
  // Not needed because output directory cleanup is handled in the run script
  removeExpoPlugin(config, 'CleanWebpackPlugin')
  // Exclude the predefined HtmlWebpackPlugin by @expo/webpack-config, and configure it manually,
  // because it is throwing a build error: "CommandError: Conflict: Multiple
  // assets emit different content to the same filename index.html"
  removeExpoPlugin(config, 'HtmlWebpackPlugin')
  // Not needed because a custom manifest.json transpilation is implemented below
  removeExpoPlugin(config, 'ExpoPwaManifestWebpackPlugin')

  const defaultExpoConfigPlugins = [...config.plugins]

  // override MiniCssExtractPlugin only for prod to serve the css files in the main build directory
  if (config.mode === 'production') {
    removeExpoPlugin(config, 'MiniCssExtractPlugin')
    defaultExpoConfigPlugins.push(new MiniCssExtractPlugin()) // default filename: [name].css

    config.optimization.minimize = true // optimize bundle by minifying
  } else if (config.mode === 'development') {
    // writeToDisk: output dev bundled files (in /webkit-dev or /gecko-dev) to import them as unpacked extension in the browser
    config.devServer.devMiddleware.writeToDisk = true

    // The extension loads two entries (main + rootTheme). Without a shared runtime each one
    // embeds its own webpack runtime, so the page ends up with two competing HMR runtimes
    // and hot reloading breaks. Give main + rootTheme a single shared runtime chunk.
    // Every other entry returns `false` to keep its runtime embedded — they run in separate
    // contexts (service worker, content script, injected script) and can't load an external
    // runtime file. Don't return the entry name here: that points `runtime` at the entry's
    // own chunk and webpack errors out.
    config.optimization = {
      ...config.optimization,
      runtimeChunk: {
        name: (entrypoint) => (['main', 'rootTheme'].includes(entrypoint.name) ? 'runtime' : false)
      }
    }
  }

  config.ignoreWarnings = [
    {
      // Ignore any warnings that include the text 'Failed to parse source map'.
      // As far as we could debug, these are not critical and lib specific.
      // Webpack can't find source maps for specific packages, which is fine.
      message: /Failed to parse source map/
    },
    // react-native-worklets uses Metro-specific require.getModules()/resolveWeak();
    // those APIs don't exist in webpack. Safe to ignore for web/extension builds.
    (warning, compilation) => {
      if (
        typeof warning.message !== 'string' ||
        !warning.message.includes(
          'Critical dependency: require function is used in a way in which dependencies cannot be statically extracted'
        )
      ) {
        return false
      }
      const requestShortener = compilation?.requestShortener
      const moduleId = warning.module?.readableIdentifier?.(requestShortener) ?? ''
      const file = warning.file || warning.module?.resource || ''
      return moduleId.includes('react-native-worklets') || file.includes('react-native-worklets')
    }
  ]

  config.resolve.extensions = [...(config.resolve.extensions || []), '.scss']

  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    '@': path.resolve(ROOT_DIR, 'src/ambire-common/src'),
    '@test': path.resolve(ROOT_DIR, 'src/ambire-common/test'),
    '@ambire-common': path.resolve(ROOT_DIR, 'src/ambire-common/src'),
    '@contracts': path.resolve(ROOT_DIR, 'src/ambire-common/contracts'),
    '@ambire-common-v1': path.resolve(ROOT_DIR, 'src/ambire-common/v1'),
    '@common': path.resolve(ROOT_DIR, 'src/common'),
    '@mobile': path.resolve(ROOT_DIR, 'src/mobile'),
    '@web': path.resolve(ROOT_DIR, 'src/web'),
    '@benzin': path.resolve(ROOT_DIR, 'src/benzin'),
    '@legends': path.resolve(ROOT_DIR, 'src/legends'),
    ...(enableLavaMoat
      ? {
          // reflect-metadata is installed early via LavaMoat staticShims_experimental.
          // Alias it to a noop module to prevent a second execution after harden.
          'reflect-metadata$': path.resolve(ROOT_DIR, 'lavamoat/shims/reflect-metadata-noop.js')
        }
      : {}),
    // There will be 2 instances of React if node_modules are installed in src/ambire-common.
    // That's why we need to alias the React package to the one in the root node_modules.
    react: path.resolve(ROOT_DIR, 'node_modules/react')
  }

  config.resolve.fallback = {
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify')
  }

  config.output = {
    // possible output paths: /webkit-dev, /gecko-dev, /webkit-prod, gecko-prod, /benzin-dev, /benzin-prod, /legends-dev, /legends-prod
    path: path.resolve(ROOT_DIR, `build/${process.env.WEBPACK_BUILD_OUTPUT_PATH}`),
    // Defaults to using 'auto', but this is causing problems in some environments
    // like in certain browsers, when building (and running) in extension context.
    publicPath: '',
    environment: { dynamicImport: true },
    hashSalt: 'ambire-salt'
  }

  if (isGecko) {
    // By default, Webpack uses importScripts for loading chunks, which works only in web workers.
    // However, Gecko-based browsers (like Firefox) still rely on background scripts instead of workers.
    // To ensure compatibility, we switch to using JSONP for chunk loading and 'array-push' for chunk format.
    config.output.chunkLoading = 'jsonp'
    config.output.chunkFormat = 'array-push'
  }

  if (config.mode === 'production') {
    config.output.assetModuleFilename = '[name]-[hash:8][ext]'
    config.output.filename = '[name].js'
    config.output.chunkFilename = '[id].js'
  }

  return { config, defaultExpoConfigPlugins, enableLavaMoat }
}

module.exports = { createBaseConfig, hardenTerser, CJS_RULE, ROOT_DIR }
