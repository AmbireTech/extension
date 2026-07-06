/* eslint-disable @typescript-eslint/no-require-imports */
const webpack = require('webpack')
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const WebExtensionPlugin = require('webpack-target-webextension')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const expoEnv = require('@expo/webpack-config/env')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const LavaMoatPlugin = require('@lavamoat/webpack')
const { validateEnvVariables } = require('../scripts/validateEnv')
const appJSON = require('../app.json')
const AssetReplacePlugin = require('../plugins/AssetReplacePlugin')
const createLavamoatUnsafeLayerPlugin = require('../lavamoat/plugins/lavamoat-unsafe-layer-plugin')
const createLavamoatUnsafePackagesPlugin = require('../lavamoat/plugins/lavamoat-unsafe-packages-plugin')
const LavamoatIgnoredModulesVerifyPlugin = require('../lavamoat/plugins/lavamoat-ignored-modules-verify-plugin')
const { isWebkit, isGecko, isSafari, isAmbireNext } = require('./env')
const { CJS_RULE, hardenTerser, ROOT_DIR } = require('./shared')

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

// style.css output file for WEB_ENGINE: GECKO
function processStyleGecko(content) {
  const style = content.toString()
  // Firefox extensions max window height is 600px
  // so IF min-height is changed above 600, this needs to be put back
  // style = style.replace('min-height: 730px;', 'min-height: 600px;')

  return style
}

// Transform the source manifest.json for the target engine (isGecko / isSafari /
// isWebkit) and the build mode ('development' | 'production').
function processManifest(content, mode) {
  const manifest = JSON.parse(content.toString())
  if (mode === 'development') {
    manifest.name = `${manifest.name} (DEV build)`
  }
  if (isAmbireNext) {
    manifest.name = 'Ambire Web3 Wallet (NEXT build)'
    manifest.short_name = 'Ambire Next'
    manifest.action.default_title = 'Ambire Next'
  }

  // Customize extension icons to emphasize the different build
  if (mode === 'development' || isAmbireNext) {
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

// The LavaMoat plugin set, enabled only for production webkit builds: the
// LavaMoatPlugin itself, a verifier for ignored modules, and a plugin that
// always emits the SES lockdown source as a standalone asset. See the inline
// comments and README.MD for the policy-generation workflow.
function createLavaMoatPlugins() {
  return [
    new LavaMoatPlugin({
      generatePolicy: process.env.LAVAMOAT_GENERATE_POLICY === 'true',
      // Where policy.json and policy-override.json live
      policyLocation: path.resolve(ROOT_DIR, 'lavamoat/webpack'),
      // Inline the SES lockdown shim directly into the background and main UI chunks.
      // This is critical for MV3 service workers where we can't control
      // script load order via <script> tags and ensures that popup/tab UIs
      // run under SES lockdown. rootTheme runs outside SES for now due to
      // immutable-arraybuffer shim limitations.
      // Note: Chunk files (e.g. 738.js in build/webpack-prod) do NOT need inline SES:
      // they are always loaded by the webpack runtime inside background.js or
      // main.js (including background-*.js / main-*.js variants) and execute
      // in the same realm, which is already locked down.
      inlineLockdown: /^(background)(-.*)?\.js$/,
      lockdown: {
        errorTaming: 'unsafe-debug',
        stackFiltering: 'verbose',
        consoleTaming: 'unsafe',
        errorTrapping: 'none',
        unhandledRejectionTrapping: 'none',
        overrideTaming: 'moderate',
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
        const staticShims = ['reflect-metadata', path.resolve('./lavamoat/shims/console-warn.js')]

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
    new LavamoatIgnoredModulesVerifyPlugin(),
    // LavaMoat's inlineLockdown and HtmlWebpackPluginInterop are mutually exclusive.
    // When inlineLockdown is enabled, no standalone lockdown file is emitted,
    // but we need it in our HTML files (tab.html, request-window.html, index.html)
    // as <script src="./lockdown">, which requires the file to exist.
    // This plugin bridges the gap by always emitting the SES source as
    // a standalone lockdown asset alongside the inlined background.js.
    {
      apply(compiler) {
        compiler.hooks.thisCompilation.tap('EmitLockdownFilePlugin', (compilation) => {
          compilation.hooks.processAssets.tap(
            {
              name: 'EmitLockdownFilePlugin',
              stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
            },
            () => {
              const { readFileSync } = require('fs')
              const lockdownSource = readFileSync(require.resolve('ses'), 'utf-8')
              compilation.emitAsset('lockdown', new webpack.sources.RawSource(lockdownSource))
            }
          )
        })
      }
    }
  ]
}

module.exports = async function buildExtension(
  { config, defaultExpoConfigPlugins, enableLavaMoat },
  env
) {
  if (process.env.IS_TESTING !== 'true') {
    validateEnvVariables(process.env.APP_ENV)
  }
  const locations = env.locations || (await (0, expoEnv.getPathsAsync)(env.projectRoot))
  const templatePath = (fileName = '') => path.join(ROOT_DIR, './src/web', fileName)
  const templatePaths = {
    get: templatePath,
    folder: templatePath(),
    indexHtml: templatePath('index.html'),
    manifest: templatePath('manifest.json'),
    serveJson: templatePath('serve.json'),
    favicon: templatePath('favicon.ico')
  }
  locations.template = templatePaths

  // Entry points. The gecko-only content-script injection entries are added via
  // the spread below and the whole map is sorted so the entry order (and thus
  // the emitted chunk ids) stays deterministic across operating systems.
  config.entry = Object.fromEntries(
    Object.entries({
      main: config.entry[0],
      rootTheme: './src/web/public/rootTheme.ts',
      background: './src/web/extension-services/background/background.ts',
      'content-script':
        './src/web/extension-services/content-script/content-script-messenger-bridge.ts',
      'ambire-inpage': './src/web/modules/inpage/ambire-inpage.ts',
      'ethereum-inpage': './src/web/modules/inpage/ethereum-inpage.ts',
      ...(isGecko && {
        'content-script-ambire-injection':
          './src/web/extension-services/content-script/content-script-ambire-injection.ts',
        'content-script-ethereum-injection':
          './src/web/extension-services/content-script/content-script-ethereum-injection.ts'
      })
    }).sort(([a], [b]) => a.localeCompare(b)) // different order (based on OS) makes the build non-deterministic
  )

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
      transform: (content) => processManifest(content, config.mode)
    },
    {
      from: './node_modules/webextension-polyfill/dist/browser-polyfill.min.js',
      to: 'browser-polyfill.min.js'
    },
    // qr-scanner ships its decoder worker inlined inside a `new Worker(URL.createObjectURL(new Blob([...])))`
    // call. Firefox MV3 extension pages reject blob: workers under the default `script-src 'self'` CSP,
    // so we extract the worker source once at build time and serve it as a real same-origin file.
    // The QrScanner component then loads the worker from this URL, bypassing the blob fallback.
    {
      from: './node_modules/qr-scanner/qr-scanner-worker.min.js',
      to: 'qr-scanner-worker.js',
      transform(content) {
        const source = content.toString()
        const match = source.match(/new Blob\(\[`([\s\S]+?)`\]/)

        if (!match) {
          throw new Error(
            'Failed to extract worker source from qr-scanner-worker.min.js. The qr-scanner package layout may have changed.'
          )
        }

        // The captured text is the raw body of a template literal, so backticks and `${`
        // are still escaped. Unescape them so the emitted file is valid JavaScript.
        return match[1].replace(/\\`/g, '`').replace(/\\\$/g, '$')
      }
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
    ...(enableLavaMoat ? createLavaMoatPlugins() : []),
    new NodePolyfillPlugin(),
    new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' }),
    new HtmlWebpackPlugin({
      template: './src/web/public/index.html',
      filename: 'index.html',
      inject: 'body', // to auto inject the main.js bundle in the body
      chunks: ['runtime', 'rootTheme', 'main'] // include only chunks from the main entry
    }),
    new HtmlWebpackPlugin({
      template: './src/web/public/request-window.html',
      filename: 'request-window.html',
      inject: 'body', // to auto inject the main.js bundle in the body
      chunks: ['runtime', 'rootTheme', 'main'] // include only chunks from the main entry
    }),
    new HtmlWebpackPlugin({
      template: './src/web/public/tab.html',
      filename: 'tab.html',
      inject: 'body', // to auto inject the main.js bundle in the body
      chunks: ['runtime', 'rootTheme', 'main'] // include only chunks from the main entry
    }),
    new CopyPlugin({ patterns: extensionCopyPatterns })
  ]

  // Provides a global variable to all files where globalIsAmbireNext is declared including
  // content scripts and injected files
  config.plugins.push(new webpack.DefinePlugin({ globalIsAmbireNext: isAmbireNext }))

  // Register unsafe-layer plugin only in production (same environment as LavaMoatPlugin).
  // The plugin adds a rule and assigns layer='unsafe' for LAVAMOAT_UNSAFE_ENTRIES.
  // This must stay in sync with runtimeConfigurationPerChunk_experimental above.
  if (enableLavaMoat) {
    config.plugins.push(createLavamoatUnsafeLayerPlugin(LAVAMOAT_UNSAFE_ENTRIES))
    // Packages in lavamoat/webpack/unsafe-packages.json: no Compartment wrap (see plugin header).
    config.plugins.push(createLavamoatUnsafePackagesPlugin())
  }

  if (isWebkit) {
    // This plugin enables code-splitting support for the service worker, allowing it to import chunks dynamically.
    config.plugins.push(
      new WebExtensionPlugin({
        background: { serviceWorkerEntry: 'background' }
      })
    )
  } else if (isGecko) {
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

  config.module.rules.push(CJS_RULE)

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

  config.experiments = {
    asyncWebAssembly: true,
    topLevelAwait: true
  }

  // Production-only optimizations (deterministic chunk/module ids, split chunks,
  // Terser hardening).
  if (config.mode === 'production') {
    config.cache = false
    // In production mode, we need to ensure that the chunks are deterministic
    // in order to comply with the Firefox requirements for extension submission.
    config.optimization.chunkIds = 'deterministic' // Ensures same id for chunks across builds
    config.optimization.moduleIds = 'deterministic' // Ensures same id for modules across builds
    // Disables auto-generated runtime chunks, because they cause ID drift
    config.optimization.runtimeChunk = false

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
      maxSize: isGecko ? 4.5 * 1024 * 1024 : undefined,
      minSize: 0, // prevents merging small modules together automatically
      chunks(chunk) {
        // do not split into chunks the files that should be injected,
        // and background.ts as well, because on WebKit LavaMoat is injected only once in background.ts,
        // and cannot be split into chunks (since there's no corresponding html file as for the other entries main, request-window, tab).
        return (
          chunk.name !== 'ambire-inpage' &&
          chunk.name !== 'ethereum-inpage' &&
          chunk.name !== 'content-script' &&
          (!enableLavaMoat || chunk.name !== 'background')
        )
      },
      // Disable random cache groups (resulting non-deterministic chunk names)
      cacheGroups: {
        default: false,
        vendors: false
      }
    }

    // Check if we're generating LavaMoat policy - disable minification during policy generation
    // because Terser cannot properly parse LavaMoat-wrapped modules
    const isGeneratingPolicy = config.plugins.some(
      (plugin) =>
        plugin.constructor.name === 'LavaMoatPlugin' && plugin.options?.generatePolicy === true
    )

    // Disable minification entirely when generating LavaMoat policy
    // to avoid Terser conflicts with wrapped modules
    if (isGeneratingPolicy) {
      config.optimization.minimize = false
    } else {
      hardenTerser(config)
    }

    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static', // writes a self-contained HTML report
          reportFilename: 'bundle-report.html',
          openAnalyzer: true,
          generateStatsFile: true,
          statsFilename: 'stats.json',
          defaultSizes: 'parsed'
        })
      )
    }
  } else if (config.mode === 'development') {
    // Expo bakes the dev-server host (0.0.0.0) into the HMR WebSocket URL. Chrome connects
    // to ws://0.0.0.0 fine, but Firefox refuses it, and the extension pages can't fall back
    // to window.location (they run under chrome-extension:// / moz-extension://), so the
    // popup's HMR client never connects and the page never reloads on change. Pin it to
    // loopback, which both browsers accept.
    if (config.devServer?.client?.webSocketURL) {
      config.devServer.client.webSocketURL.hostname = '127.0.0.1'
    }

    // Fixes websocket errors in the background,
    // the inpage script HMR conflicting with web page websockets
    // and rootTheme breaking HMR
    const noHmrChunkNames = new Set([
      'ambire-inpage',
      'ethereum-inpage',
      'content-script',
      'background',
      'rootTheme',
      ...(isGecko ? ['content-script-ambire-injection', 'content-script-ethereum-injection'] : [])
    ])

    config.plugins.push({
      apply(compiler) {
        compiler.hooks.compilation.tap('RemoveHMRFromInpageChunks', (compilation) => {
          compilation.hooks.afterChunks.tap('RemoveHMRFromInpageChunks', (chunks) => {
            const { chunkGraph } = compilation

            for (const chunk of chunks) {
              if (!noHmrChunkNames.has(chunk.name)) continue

              const entriesToRemove = []
              for (const module of chunkGraph.getChunkEntryModulesIterable(chunk)) {
                const id = module.identifier ? module.identifier() : ''
                if (id.includes('webpack-dev-server') || id.includes('webpack/hot')) {
                  entriesToRemove.push(module)
                }
              }

              for (const module of entriesToRemove) {
                chunkGraph.disconnectChunkAndEntryModule(chunk, module)
                // disconnectChunkAndModule is a safe no-op if the module is not
                // in the chunk's regular modules set, which is the expected case
                // for global entries added by webpack-dev-server.
                chunkGraph.disconnectChunkAndModule(chunk, module)
              }
            }
          })
        })
      }
    })
  }

  return config
}
