// The 'react-native-dotenv' package doesn't work in the NodeJS context (and
// with commonjs imports), so alternatively, use 'dotenv' package to load the
// environment variables from the .env file.
require('dotenv').config()

const createExpoWebpackConfigAsync = require('@expo/webpack-config')
const webpack = require('webpack')
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const WebExtensionPlugin = require('webpack-target-webextension')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const expoEnv = require('@expo/webpack-config/env')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const LavaMoatPlugin = require('@lavamoat/webpack')
const { validateEnvVariables } = require('./scripts/validateEnv')
const appJSON = require('./app.json')
const AssetReplacePlugin = require('./plugins/AssetReplacePlugin')
const createLavamoatUnsafeLayerPlugin = require('./lavamoat/plugins/lavamoat-unsafe-layer-plugin')
const LavamoatIgnoredModulesVerifyPlugin = require('./lavamoat/plugins/lavamoat-ignored-modules-verify-plugin')

// Entries that run outside LavaMoat protection.
//
// Important: this list controls TWO mechanisms that must stay aligned:
// 1) runtimeConfigurationPerChunk_experimental -> returns { mode: 'null_unsafe' } for these names
//    so no LavaMoat runtime is injected in those chunks.
// 2) createLavamoatUnsafeLayerPlugin(...) -> marks the same entries with layer 'unsafe'
//    and applies LavaMoat.exclude so their modules are not wrapped in Compartments.
//
// If only (1) is enabled, runtime code is removed but wrapped modules may remain, which can cause
// runtime failures due to missing LavaMoat bootstrapping symbols.
const LAVAMOAT_UNSAFE_ENTRIES = new Set([
  'rootTheme',
  'ambire-inpage',
  'ethereum-inpage',
  'content-script',
  'content-script-ambire-injection',
  'content-script-ethereum-injection'
])

const isWebkit = process.env.WEB_ENGINE?.startsWith('webkit')
const isGecko = process.env.WEB_ENGINE === 'gecko'
const isSafari = process.env.WEB_ENGINE === 'webkit-safari'
const outputPath = process.env.WEBPACK_BUILD_OUTPUT_PATH
const isExtension =
  outputPath.includes('webkit') || outputPath.includes('gecko') || outputPath.includes('safari')
const isAmbireExplorer = outputPath.includes('benzin')
const isLegends = outputPath.includes('legends')
const isAmbireNext = process.env.AMBIRE_NEXT === 'true'

// style.css output file for WEB_ENGINE: GECKO
function processStyleGecko(content) {
  const style = content.toString()
  // Firefox extensions max window height is 600px
  // so IF min-height is changed above 600, this needs to be put back
  // style = style.replace('min-height: 730px;', 'min-height: 600px;')

  return style
}

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv)
  const enableLavaMoat = config.mode === 'production' && isWebkit

  function processManifest(content) {
    const manifest = JSON.parse(content.toString())
    if (config.mode === 'development') {
      manifest.name = `${manifest.name} (DEV build)`
    }
    if (isAmbireNext) {
      manifest.name = 'Ambire Web3 Wallet (NEXT build)'
      manifest.short_name = 'Ambire Next'
      manifest.action.default_title = 'Ambire Next'
    }

    // Customize extension icons to emphasize the different build
    if (config.mode === 'development' || isAmbireNext) {
      const buildIcons = {}
      const suffix = isAmbireNext ? '-next-build-ONLY' : '-dev-build-ONLY'
      Object.keys(manifest.icons).forEach((size) => {
        const iconPath = manifest.icons[size]
        const dotIndex = iconPath.lastIndexOf('.')
        const prefix = iconPath.slice(0, dotIndex)
        const extension = iconPath.slice(dotIndex)
        buildIcons[size] = `${prefix}${suffix}${extension}`
      })
      manifest.icons = buildIcons
    }

    // Note: Safari allows up to 100 characters, all others allow up to 132 characters
    manifest.description =
      'Fast & secure Web3 wallet to supercharge your account on Ethereum and EVM networks.'

    // Maintain the same versioning between the web extension and the mobile app
    manifest.version = appJSON.version

    // Directives to disallow a set of script-related privileges for a
    // specific page. They prevent the browser extension being embedded or
    // loaded as an <iframe /> in a potentially malicious website(s).
    //   1. The "script-src" directive specifies valid sources for JavaScript.
    //   This includes not only URLs loaded directly into <script> elements,
    //   but also things like inline script event handlers (onclick) and XSLT
    //   stylesheets which can trigger script execution. Must include at least
    //   the 'self' keyword and may only contain secure sources.
    //   'wasm-eval' needed, otherwise the GridPlus SDK fires errors
    //   (GridPlus needs to allow inline Web Assembly (wasm))
    //   2. The "object-src" directive may be required in some browsers that
    //   support obsolete plugins and should be set to a secure source such as
    //   'none' when needed. This may be necessary for browsers up until 2022.
    //   3. The "frame-ancestors" directive specifies valid parents that may
    //   embed a page using <frame>, <iframe>, <object>, <embed>, or <applet>.
    // {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/Sources}
    // {@link https://web.dev/csp/}

    const csp = "frame-ancestors 'none'; script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"

    if (isGecko) {
      manifest.background = { page: 'background.html' }
      manifest.host_permissions = [...manifest.host_permissions, '<all_urls>']
      manifest.browser_specific_settings = {
        gecko: {
          id: 'wallet@ambire.com',
          strict_min_version: '116.0'
        }
      }
    }

    if (isGecko || isSafari) {
      manifest.externally_connectable = undefined
    }

    const permissions = [...manifest.permissions, 'scripting', 'alarms']
    if (isWebkit && !isSafari) permissions.push('system.display')
    manifest.permissions = permissions

    if (isSafari) {
      manifest.permissions = manifest.permissions.filter((p) => p !== 'notifications')
    }

    manifest.content_security_policy = { extension_pages: csp }

    // This value can be used to control the unique ID of an extension,
    // when it is loaded during development. In prod, the ID is generated
    // in Chrome Web Store and can't be changed.
    // {@link https://developer.chrome.com/extensions/manifest/key}
    // TODO: key not supported in gecko browsers
    if (isWebkit) {
      manifest.key = process.env.BROWSER_EXTENSION_PUBLIC_KEY
    }

    const manifestJSON = JSON.stringify(manifest, null, 2)
    return manifestJSON
  }

  // Global configuration
  config.resolve.alias['@ledgerhq/devices/hid-framing'] = '@ledgerhq/devices/lib/hid-framing'
  config.resolve.alias.dns = 'dns-js'

  // The files in the /web directory should be transpiled not just copied
  const excludeCopyPlugin = config.plugins.findIndex(
    (plugin) => plugin.constructor.name === 'CopyPlugin'
  )
  if (excludeCopyPlugin !== -1) {
    config.plugins.splice(excludeCopyPlugin, 1)
  }
  // Not needed because output directory cleanup is handled in the run script
  const excludeCleanWebpackPlugin = config.plugins.findIndex(
    (plugin) => plugin.constructor.name === 'CleanWebpackPlugin'
  )
  if (excludeCleanWebpackPlugin !== -1) {
    config.plugins.splice(excludeCleanWebpackPlugin, 1)
  }

  // Exclude the predefined HtmlWebpackPlugin by @expo/webpack-config, and configure it manually,
  // because it is throwing a build error: "CommandError: Conflict: Multiple
  // assets emit different content to the same filename index.html"
  const excludeHtmlWebpackPlugin = config.plugins.findIndex(
    (plugin) => plugin.constructor.name === 'HtmlWebpackPlugin'
  )
  if (excludeHtmlWebpackPlugin !== -1) {
    config.plugins.splice(excludeHtmlWebpackPlugin, 1)
  }
  // Not needed because a custom manifest.json transpilation is implemented below
  const excludeExpoPwaManifestWebpackPlugin = config.plugins.findIndex(
    (plugin) => plugin.constructor.name === 'ExpoPwaManifestWebpackPlugin'
  )
  if (excludeExpoPwaManifestWebpackPlugin !== -1) {
    config.plugins.splice(excludeExpoPwaManifestWebpackPlugin, 1)
  }

  const defaultExpoConfigPlugins = [...config.plugins]

  // override MiniCssExtractPlugin only for prod to serve the css files in the main build directory
  if (config.mode === 'production') {
    const excludeMiniCssExtractPluginPlugin = config.plugins.findIndex(
      (plugin) => plugin.constructor.name === 'MiniCssExtractPlugin'
    )
    if (excludeMiniCssExtractPluginPlugin !== -1) {
      config.plugins.splice(excludeMiniCssExtractPluginPlugin, 1)
    }
    defaultExpoConfigPlugins.push(new MiniCssExtractPlugin()) // default filename: [name].css

    // @TODO: The extension doesn't work with splitChunks out of the box, so disable it for now
    config.optimization.minimize = true // optimize bundle by minifying
  } else if (config.mode === 'development') {
    // writeToDisk: output dev bundled files (in /webkit-dev or /gecko-dev) to import them as unpacked extension in the browser
    config.devServer.devMiddleware.writeToDisk = true
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
    '@': path.resolve(__dirname, 'src/ambire-common/src'),
    '@test': path.resolve(__dirname, 'src/ambire-common/test'),
    '@ambire-common': path.resolve(__dirname, 'src/ambire-common/src'),
    '@contracts': path.resolve(__dirname, 'src/ambire-common/contracts'),
    '@ambire-common-v1': path.resolve(__dirname, 'src/ambire-common/v1'),
    '@common': path.resolve(__dirname, 'src/common'),
    '@mobile': path.resolve(__dirname, 'src/mobile'),
    '@web': path.resolve(__dirname, 'src/web'),
    '@benzin': path.resolve(__dirname, 'src/benzin'),
    '@legends': path.resolve(__dirname, 'src/legends'),
    ...(enableLavaMoat
      ? {
          // reflect-metadata is installed early via LavaMoat staticShims_experimental.
          // Alias it to a noop module to prevent a second execution after harden.
          'reflect-metadata$': path.resolve(__dirname, 'lavamoat/shims/reflect-metadata-noop.js')
        }
      : {}),
    react: path.resolve(__dirname, 'node_modules/react')
  }

  config.resolve.fallback = {
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify')
  }

  // There will be 2 instances of React if node_modules are installed in src/ambire-common.
  // That's why we need to alias the React package to the one in the root node_modules.

  config.output = {
    // possible output paths: /webkit-dev, /gecko-dev, /webkit-prod, gecko-prod, /benzin-dev, /benzin-prod, /legends-dev, /legends-prod
    path: path.resolve(__dirname, `build/${process.env.WEBPACK_BUILD_OUTPUT_PATH}`),
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

  // Environment specific configurations
  if (isExtension) {
    // eslint-disable-next-line no-console
    console.log('Building extension with relayer:', process.env.RELAYER_URL)
    if (process.env.IS_TESTING !== 'true') {
      validateEnvVariables(process.env.APP_ENV)
    }
    const locations = env.locations || (await (0, expoEnv.getPathsAsync)(env.projectRoot))
    const templatePath = (fileName = '') => path.join(__dirname, './src/web', fileName)
    const templatePaths = {
      get: templatePath,
      folder: templatePath(),
      indexHtml: templatePath('index.html'),
      manifest: templatePath('manifest.json'),
      serveJson: templatePath('serve.json'),
      favicon: templatePath('favicon.ico')
    }
    locations.template = templatePaths

    config.entry = Object.fromEntries(
      Object.entries({
        main: config.entry[0],
        rootTheme: './src/web/public/rootTheme.ts',
        background: './src/web/extension-services/background/background.ts',
        'content-script':
          './src/web/extension-services/content-script/content-script-messenger-bridge.ts',
        'ambire-inpage': './src/web/extension-services/inpage/ambire-inpage.ts',
        'ethereum-inpage': './src/web/extension-services/inpage/ethereum-inpage.ts',
        ...(isGecko && {
          'content-script-ambire-injection':
            './src/web/extension-services/content-script/content-script-ambire-injection.ts',
          'content-script-ethereum-injection':
            './src/web/extension-services/content-script/content-script-ethereum-injection.ts'
        })
      }).sort(([a], [b]) => a.localeCompare(b)) // different order (based on OS) makes the build non-deterministic
    )

    if (isGecko) {
      config.entry['content-script-ambire-injection'] =
        './src/web/extension-services/content-script/content-script-ambire-injection.ts'
      config.entry['content-script-ethereum-injection'] =
        './src/web/extension-services/content-script/content-script-ethereum-injection.ts'
    }

    const extensionCopyPatterns = [
      {
        from: './src/web/assets',
        to: 'assets'
      },
      {
        from: './src/web/public/style.css',
        to: 'style.css',
        transform(content) {
          if (isGecko) {
            return processStyleGecko(content)
          }

          return content
        }
      },
      {
        from: './src/web/public/manifest.json',
        to: 'manifest.json',
        transform: processManifest
      },
      {
        from: './node_modules/webextension-polyfill/dist/browser-polyfill.min.js',
        to: 'browser-polyfill.min.js'
      }
    ]

    config.plugins = [
      ...defaultExpoConfigPlugins,
      // LavaMoatPlugin wraps module generators (normalModuleFactory.hooks.generator)
      // and must be registered before other plugins that process modules (like Terser)
      // to avoid conflicts. Note: plugin order in array doesn't guarantee execution order;
      // LavaMoatPlugin registers on early hooks (beforeRun, thisCompilation) which ensures
      // it runs before optimization/minification plugins.
      // See README.MD for policy generation workflow and when to regenerate policies.
      // Only enabled in production builds to avoid HMR conflicts in development.
      // TODO: Enable for Gecko soon as well.
      // Gecko currently has a conflict with inlineLockdown because main.js and background.js are split into chunks there,
      // and ses lockdown is initialized multiple times in the same realm.
      ...(enableLavaMoat
        ? [
            new LavaMoatPlugin({
              generatePolicy: process.env.LAVAMOAT_GENERATE_POLICY === 'true',
              // Where policy.json and policy-override.json live
              policyLocation: path.resolve(__dirname, 'lavamoat/webpack'),
              // Inline the SES lockdown shim directly into the background and main UI chunks.
              // This is critical for MV3 service workers where we can't control
              // script load order via <script> tags and ensures that popup/tab UIs
              // run under SES lockdown. rootTheme runs outside SES for now due to
              // immutable-arraybuffer shim limitations.
              // Note: Chunk files (e.g. 738.js in build/webpack-prod) do NOT need inline SES:
              // they are always loaded by the webpack runtime inside background.js or
              // main.js (including background-*.js / main-*.js variants) and execute
              // in the same realm, which is already locked down.
              inlineLockdown: /^(background|main)(-.*)?\.js$/,
              lockdown: {
                errorTaming: 'unsafe-debug',
                stackFiltering: 'verbose',
                consoleTaming: 'unsafe',
                errorTrapping: 'none',
                unhandledRejectionTrapping: 'none',
                overrideTaming: 'severe',
                localeTaming: 'unsafe'
              },
              // Keep resource IDs readable for easier debugging and policy maintenance.
              // Set to true during policy generation for easier debugging, false in production
              // to reduce bundle size. Same policy works for both gecko and webkit builds.
              readableResourceIds: process.env.LAVAMOAT_GENERATE_POLICY === 'true',
              // HtmlWebpackPluginInterop is only used when inlineLockdown is NOT set.
              // Since we use inlineLockdown (required for MV3 service workers), this
              // is a no-op. SES is prepended directly into background.js, which works
              // for both MV3 (service worker) and Gecko (loaded via <script> tag).
              HtmlWebpackPluginInterop: false,
              // Policy validation checks. Disable during initial policy generation to
              // avoid CodeGenerationError issues. Re-enable once policy.json is stable
              // to catch policy violations early.
              runChecks: process.env.LAVAMOAT_GENERATE_POLICY !== 'true',
              // Per-chunk LavaMoat mode:
              // - null_unsafe for entries listed in LAVAMOAT_UNSAFE_ENTRIES
              //   (no LavaMoat runtime injected in that chunk)
              // - safe for all other chunks
              //   (Compartment runtime + policy enforcement; lockdown where inlineLockdown matches)
              runtimeConfigurationPerChunk_experimental: (chunk) => {
                if (chunk.name && LAVAMOAT_UNSAFE_ENTRIES.has(chunk.name)) {
                  return { mode: 'null_unsafe' }
                }
                const staticShims = [
                  'reflect-metadata',
                  path.resolve('./lavamoat/shims/console-warn.js')
                ]

                // setimmediate is needed only in background runtime paths.
                // Keeping it scoped avoids side effects in UI chunks.
                if (chunk.name === 'background') {
                  staticShims.push('setimmediate')
                }

                return { mode: 'safe', staticShims }
              },
              // Diagnostics verbosity (0-2):
              //   0: Minimal logging (recommended for normal builds)
              //   1: Moderate logging (useful for debugging policy issues)
              //   2: Verbose logging (use only when investigating deep issues)
              // Set to 0 to avoid error logging conflicts with Expo's progress bar.
              diagnosticsVerbosity: process.env.LAVAMOAT_GENERATE_POLICY === 'true' ? 1 : 0
            }),
            // Verify that any modules LavaMoat is forced to ignore at runtime
            // are either fully tree-shaken or otherwise empty placeholders.
            // The plugin appends a short ✅/❌ status and explanation to the
            // original LavaMoat warning message.
            new LavamoatIgnoredModulesVerifyPlugin()
          ]
        : []),
      new NodePolyfillPlugin(),
      new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' }),
      new HtmlWebpackPlugin({
        template: './src/web/public/index.html',
        filename: 'index.html',
        inject: 'body', // to auto inject the main.js bundle in the body
        chunks: ['rootTheme', 'main'] // include only chunks from the main entry
      }),
      new HtmlWebpackPlugin({
        template: './src/web/public/request-window.html',
        filename: 'request-window.html',
        inject: 'body', // to auto inject the main.js bundle in the body
        chunks: ['rootTheme', 'main'] // include only chunks from the main entry
      }),
      new HtmlWebpackPlugin({
        template: './src/web/public/tab.html',
        filename: 'tab.html',
        inject: 'body', // to auto inject the main.js bundle in the body
        chunks: ['rootTheme', 'main'] // include only chunks from the main entry
      }),
      new CopyPlugin({ patterns: extensionCopyPatterns })
    ]

    // Provides a global variable to all files where globalIsAmbireNext is declared including
    // content scripts and injected files
    config.plugins.push(new webpack.DefinePlugin({ globalIsAmbireNext: isAmbireNext }))

    // Some dependencies, such as @metamask/eth-sig-util v7+ and v8+, ship .cjs
    // files and define "exports" fields in their package.json. In multi-entry
    // builds (like ours), Webpack 5 can get confused and attempt to emit the
    // same .cjs file into multiple chunks, causing the error:
    // "Multiple chunks emit assets to the same filename index..cjs".
    // This rule tells Webpack to treat .cjs files as regular JS (not ESM),
    // which prevents chunk emission conflicts.
    config.module.rules.push({
      test: /\.cjs$/,
      type: 'javascript/auto'
    })

    // Allow @expo-google-fonts assets (TTF/WOFF/etc) to be emitted explicitly instead of
    // relying on Webpack's "ambient" asset behavior. LavaMoat treats ambient assets from
    // node_modules (type === 'asset/resource' with no loaders) as suspicious and blocks
    // them with a "silently emitted to the dist directory" warning. By declaring a
    // dedicated asset rule for these fonts and using type: 'asset', we:
    //   - keep them under explicit build control (they are no longer "ambient" assets)
    //   - avoid the LavaMoat ambient-asset guard for these known-safe font files
    //   - still reuse the global assetModuleFilename ('[name]-[hash:8][ext]'), so
    //     filenames like GeistMono_100Thin-a5a6a661.ttf remain unchanged.
    config.module.rules.push({
      test: /\.(ttf|otf|eot|woff2?)$/i,
      include: /node_modules\/@expo-google-fonts\//,
      type: 'asset'
    })

    // Register unsafe-layer plugin only in production (same environment as LavaMoatPlugin).
    // The plugin adds a rule and assigns layer='unsafe' for LAVAMOAT_UNSAFE_ENTRIES.
    // This must stay in sync with runtimeConfigurationPerChunk_experimental above.
    if (enableLavaMoat) {
      config.plugins.push(createLavamoatUnsafeLayerPlugin(LAVAMOAT_UNSAFE_ENTRIES))
    }

    if (isWebkit) {
      // This plugin enables code-splitting support for the service worker, allowing it to import chunks dynamically.
      config.plugins.push(
        new WebExtensionPlugin({
          background: { serviceWorkerEntry: 'background' }
        })
      )
    }

    if (isGecko) {
      // Makes the code-splitting possible for the background entry
      // Ensures that only chunks related to the background entry are included in the background HTML file, preventing unnecessary chunk imports
      config.plugins.push(
        new HtmlWebpackPlugin({
          template: './src/web/public/background.html',
          filename: 'background.html',
          inject: 'body', // to auto inject the background.js bundle in the body
          chunks: ['background'] // include only chunks from the background entry
        })
      )
      config.plugins.push(
        new AssetReplacePlugin({
          '#AMBIREINPAGE#': 'ambire-inpage',
          '#ETHEREUMINPAGE#': 'ethereum-inpage'
        })
      )
    }

    if (config.mode === 'production') {
      config.cache = false
      // In production mode, we need to ensure that the chunks are deterministic
      // in order to comply with the Firefox requirements for extension submission.
      config.optimization.chunkIds = 'deterministic' // Ensures same id for chunks across builds
      config.optimization.moduleIds = 'deterministic' // Ensures same id for modules across builds
      // Disables auto-generated runtime chunks, because they cause ID drift
      config.optimization.runtimeChunk = false

      if (enableLavaMoat) {
        // No extra chunks for webkit, because it conflicts with LavaMoat plugin,
        // and currently there's no other benefit to enable it.
        config.optimization.splitChunks = false
      } else {
        config.optimization.splitChunks = {
          ...config.optimization.splitChunks,
          // Firefox enforces a 5MB per-file size limit for extensions.
          // In the v5 extension series we intentionally avoided setting maxSize,
          // because 1) it could lead to non-reproducible chunk filenames and
          // 2) it wasn't needed at the time (no bundle was > 5MB).
          // With v6 extension series + new features/core lib updates exceeded 5MB
          // for two of the resulting js bundles, so we re-enabled maxSize.
          // On theory, it should be deterministic with chunkIds/moduleIds set to
          // 'deterministic' and chunkFilename = '[id].js'.
          // Note: maxSize uses estimated sizes; keep some headroom so emitted
          // bundles stay under the linter's real per-file limit.
          maxSize: isGecko ? 4.5 * 1024 * 1024 : 0,
          minSize: 0, // prevents merging small modules together automatically
          chunks(chunk) {
            // do not split into chunks the files that should be injected
            return (
              chunk.name !== 'ambire-inpage' &&
              chunk.name !== 'ethereum-inpage' &&
              chunk.name !== 'content-script'
            )
          },
          // Disable random cache groups (resulting non-deterministic chunk names)
          cacheGroups: {
            default: false,
            vendors: false
          }
        }
      }

      // Check if we're generating LavaMoat policy - disable minification during policy generation
      // because Terser cannot properly parse LavaMoat-wrapped modules
      const isGeneratingPolicy = config.plugins.some(
        (plugin) =>
          plugin.constructor.name === 'LavaMoatPlugin' && plugin.options?.generatePolicy === true
      )

      // Find and configure TerserPlugin in the minimizer array
      const terserPlugin = config.optimization.minimizer?.find(
        (minimizer) => minimizer.constructor.name === 'TerserPlugin'
      )
      if (terserPlugin) {
        // Disable minification entirely when generating LavaMoat policy
        // to avoid Terser conflicts with wrapped modules
        if (isGeneratingPolicy) {
          config.optimization.minimize = false
        } else {
          const terserRealOptions = terserPlugin.options.minimizer?.options

          if (terserRealOptions) {
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

            // Disable mangling:
            // 1) For Firefox, to ensure bit-for-bit deterministic builds across
            // platforms (e.g. x64 vs arm64). This avoids differences in
            // variable/function names (e.g. P vs x) that can cause review rejections.
            // 2) For Webkit as well avoid issues with GridPlus SDK - signing
            // EIP-712 messages fail with PROD build on Linux (work just fine on DEV)
            // because the mangling messes up the gridplus-sdk package somehow.
            // The drawback is larger bundle size.
            terserRealOptions.mangle = false
          }
          // Preserve class names so `this.constructor.name` logic works dynamically
          terserRealOptions.keep_classnames = true
        }
      }
    }

    config.experiments = {
      asyncWebAssembly: true,
      topLevelAwait: true
    }

    return config
  }
  if (isAmbireExplorer) {
    // Not entering this branch causes the error:
    // handleAction: Controller ProvidersController not found
    // This is a temporary fix
    const ARE_CONTROLLERS_BROKEN_WITH_MINIMIZE = true

    if (process.env.APP_ENV === 'development' || ARE_CONTROLLERS_BROKEN_WITH_MINIMIZE) {
      config.optimization = { minimize: false }
    } else {
      delete config.optimization.splitChunks
    }

    config.entry = './src/benzin/index.js'

    config.resolve.fallback = {
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify')
    }

    const terserPlugin = config.optimization.minimizer?.find(
      (minimizer) => minimizer.constructor.name === 'TerserPlugin'
    )
    if (terserPlugin) {
      const terserRealOptions = terserPlugin.options.minimizer?.options

      if (terserRealOptions) {
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
    }

    config.plugins = [
      ...defaultExpoConfigPlugins,
      new NodePolyfillPlugin(),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process'
      }),
      new CopyPlugin({
        patterns: [
          {
            from: './src/web/assets',
            to: 'assets'
          },
          {
            from: './src/benzin/public/style.css',
            to: 'style.css'
          },
          {
            from: './src/benzin/public/index.html',
            to: 'index.html'
          },
          {
            from: './src/benzin/public/favicon.ico',
            to: 'favicon.ico'
          }
        ]
      })
    ]

    config.module.rules.push({
      test: /\.cjs$/,
      type: 'javascript/auto'
    })

    return config
  }
  if (isLegends) {
    config.output.clean = true
    config.entry = './src/legends/index.js'

    config.resolve.fallback = {
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify')
    }

    if (process.env.APP_ENV === 'development') {
      config.optimization = { minimize: false }
    }

    // Add scss support
    config.module.rules[1].oneOf = config.module.rules[1].oneOf.map((rule) => {
      if (rule.exclude && rule.type === 'asset/resource') {
        rule.exclude.push(/\.scss$/)
      }

      return rule
    })

    config.module.rules = [
      ...config.module.rules,
      {
        test: /\.module\.scss$/, // SCSS module rule
        use: [
          'style-loader', // Injects styles into the DOM
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName:
                  process.env.APP_ENV === 'development'
                    ? '[name]__[local]--[hash:base64:5]' // Development: readable names
                    : '[hash:base64]' // Production: hashed names for optimization
              },
              sourceMap: process.env.APP_ENV === 'development',
              esModule: false // DON'T DELETE: This is needed for the styles to work
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: [path.resolve(__dirname, './src/legends')]
              }
            }
          }
        ]
      },
      {
        test: /\.scss$/, // Regular SCSS rule (for global styles)
        exclude: /\.module\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      }
    ]

    const terserPlugin = config.optimization.minimizer?.find(
      (minimizer) => minimizer.constructor.name === 'TerserPlugin'
    )
    if (terserPlugin) {
      const terserRealOptions = terserPlugin.options.minimizer?.options

      if (terserRealOptions) {
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
    }

    config.plugins = [
      ...defaultExpoConfigPlugins,
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process'
      }),
      new NodePolyfillPlugin(),
      new HtmlWebpackPlugin({
        template: './src/legends/public/index.html',
        filename: 'index.html',
        inject: 'body',
        hash: true
      }),
      new CopyPlugin({
        patterns: [
          {
            from: 'src/legends/public', // Source directory
            to: path.resolve(__dirname, `build/${process.env.WEBPACK_BUILD_OUTPUT_PATH}`), // Destination directory
            globOptions: {
              ignore: ['**/*.html'] // Ignore HTML files as they are handled by HtmlWebpackPlugin
            }
          }
        ]
      })
    ]

    config.module.rules.push({
      test: /\.cjs$/,
      type: 'javascript/auto'
    })

    return config
  }
  // @TODO: Add mobile app build configuration here

  throw new Error('Invalid WEBPACK_BUILD_OUTPUT_PATH')
}
