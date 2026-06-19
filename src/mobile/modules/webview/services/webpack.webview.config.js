const path = require('path')
const webpack = require('webpack')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') })
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const fs = require('fs')
const crypto = require('crypto')
const { execSync } = require('child_process')

// Since Webpack is executed from the project root via package.json scripts,
// process.cwd() provides the absolute path to the project root directory
const ROOT_DIR = process.cwd()
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('serve')

// Production worker bundle output dirs, loaded by the WebView via `file://`.
// iOS: folder-referenced from Xcode into the signed `.app`. Android: packaged
// by Gradle, reachable via `file:///android_asset/`.
const IOS_WEBVIEW_DIR = path.resolve(ROOT_DIR, 'ios/Ambire/Resources/webview')
const ANDROID_WEBVIEW_DIR = path.resolve(ROOT_DIR, 'android/app/src/main/assets/webview')
// Services dir holds the require()-d JSON bundles that ride the Metro/OTA bundle.
const SERVICES_DIR = path.resolve(ROOT_DIR, 'src/mobile/modules/webview/services')

// In dev, ensure inpage bundle JSON files exist (injected into dapp WebViews
// as strings, no file-based fallback). The worker bundle is served from
// webpack-dev-server in dev.
if (isDev) {
  const bundleFiles = [
    'ethereum-inpage-bundle.json',
    'ambire-inpage-bundle.json',
    'webview-bundle-ota.json'
  ]
  const allBundlesExist = bundleFiles.every((file) => fs.existsSync(path.join(SERVICES_DIR, file)))

  if (!allBundlesExist) {
    console.log('[webpack] Bundle files missing. Running production build to generate them...')
    try {
      execSync(
        'npx webpack --config src/mobile/modules/webview/services/webpack.webview.config.js',
        {
          cwd: ROOT_DIR,
          env: { ...process.env, WEB_ENGINE: 'webview', NODE_ENV: 'production' },
          stdio: 'inherit'
        }
      )
      console.log('[webpack] Production build completed. Starting dev server...')
    } catch (err) {
      console.error('[webpack] Failed to generate bundle files:', err.message)
      process.exit(1)
    }
  }
}

/**
 * Shared Resolver Configuration
 */
const sharedResolve = {
  extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.web.js', '.js', '.jsx'],
  fallback: {
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify'),
    buffer: require.resolve('buffer')
  },
  alias: {
    '@ambire-common': path.resolve(ROOT_DIR, 'src/ambire-common/src'),
    '@common': path.resolve(ROOT_DIR, 'src/common'),
    '@mobile': path.resolve(ROOT_DIR, 'src/mobile'),
    '@web': path.resolve(ROOT_DIR, 'src/web'),
    react: path.resolve(ROOT_DIR, 'node_modules/react'),
    'react-native$': 'react-native-web',
    'react-native-quick-crypto': 'crypto-browserify',
    'react-native-quick-base64': 'buffer',
    'scrypt-js': path.resolve(ROOT_DIR, 'src/mobile/shims/scrypt-js.ts'),
    pbkdf2: path.resolve(ROOT_DIR, 'src/mobile/shims/pbkdf2.ts'),
    '@react-native-community/netinfo': false,
    'react-native-mmkv': false
  }
}

/**
 * Shared Babel Rules
 */
const sharedRules = [
  {
    test: /\.(js|jsx|ts|tsx|mjs)$/,
    exclude:
      /node_modules\/(?!(.*@metamask.*|.*@noble.*|.*ethers.*|.*@ambire-common.*|.*@babel\/runtime.*|.*siwe.*|.*valibot.*|.*expo.*))/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          sourceType: 'unambiguous',
          presets: [
            ['@babel/preset-env', { targets: { ios: '15', chrome: '100' }, modules: false }],
            '@babel/preset-typescript',
            ['@babel/preset-react', { runtime: 'automatic' }]
          ],
          plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-transform-class-properties'],
            ['@babel/plugin-transform-private-methods'],
            ['@babel/plugin-transform-private-property-in-object']
          ]
        }
      }
    ]
  },
  {
    test: /\.cjs$/,
    type: 'javascript/auto'
  }
]

/**
 * Shared Plugins
 */
const sharedPlugins = [
  new NodePolyfillPlugin(),
  new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' }),
  new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })
]

/**
 * Webpack Plugin to wrap the generated JS bundle into a JSON file for React Native injection.
 */
class JsonWrapPlugin {
  constructor(options) {
    this.assetName = options.assetName
  }

  apply(compiler) {
    compiler.hooks.emit.tap('JsonWrapPlugin', (compilation) => {
      const asset = compilation.assets[this.assetName]
      if (asset) {
        const code = asset.source().toString()
        const codeString = typeof code === 'string' ? code : code.toString('utf8')
        const cleanCode = codeString.replace(/"AMBIRE_PROVIDER_NONCE"/g, 'AMBIRE_PROVIDER_NONCE')

        const jsonCode = JSON.stringify({ code: cleanCode })
        const jsonAssetName = this.assetName.replace('.js', '.json')

        compilation.assets[jsonAssetName] = {
          source: () => jsonCode,
          size: () => jsonCode.length
        }

        // Keep the JS file if in development (for serving), but delete in production
        if (compilation.options.mode === 'production') {
          delete compilation.assets[this.assetName]
          delete compilation.assets[`${this.assetName}.LICENSE.txt`]
        }
      }
    })
  }
}

/**
 * Emits `webview-bundle.html` next to `webview-bundle.js`. The bundle loads via
 * a `<script src>` tag pinned with a build-time SHA-384 SRI hash under a strict
 * CSP (`script-src 'self'`, `connect-src 'none'`).
 */
class WorkerHtmlPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('WorkerHtmlPlugin', (compilation) => {
      // REPORT stage runs after TerserPlugin minifies, so the SRI hash matches
      // the shipped bytes.
      compilation.hooks.processAssets.tap(
        {
          name: 'WorkerHtmlPlugin',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT
        },
        (assets) => {
          const jsAsset = assets['webview-bundle.js']
          if (!jsAsset) return

          const jsBytes = jsAsset.source()
          const jsBuffer = Buffer.isBuffer(jsBytes) ? jsBytes : Buffer.from(jsBytes)
          const sriHash = `sha384-${crypto.createHash('sha384').update(jsBuffer).digest('base64')}`

          // Reports a failure to LOAD the bundle <script> (missing/blocked
          // file) to RN. Scoped to the bundle script element so benign resource
          // errors elsewhere are not reported. Allowed by a CSP hash, so the
          // policy avoids `'unsafe-inline'`.
          const onErrorScript = `window.addEventListener('error', function (e) {
  var t = e && e.target;
  if (!t || t.tagName !== 'SCRIPT' || (t.src || '').indexOf('webview-bundle.js') === -1) return;
  try {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'ctrl.error',
      payload: { ctrlName: 'BundleLoad', errors: [{ message: 'Failed to load webview-bundle.js', url: t.src }] }
    }));
  } catch (_) {}
}, true);`
          const onErrorHash = `sha384-${crypto
            .createHash('sha384')
            .update(Buffer.from(onErrorScript, 'utf8'))
            .digest('base64')}`

          // `script-src` uses the `file:` scheme (not `'self'`, which an opaque
          // `file://` origin does not match) for the sibling bundle, plus a hash
          // for the inline error handler. Not a wide grant — navigation is
          // locked to the single bundle URI (see onShouldStartLoadWithRequest),
          // so the only `file:` script reachable is our own bundle.
          const csp = [
            "default-src 'none'",
            `script-src file: '${onErrorHash}'`,
            "connect-src 'none'",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'none'",
            "form-action 'none'"
          ].join('; ')

          const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <script>${onErrorScript}</script>
  </head>
  <body>
    <script src="webview-bundle.js" integrity="${sriHash}" crossorigin="anonymous"></script>
  </body>
</html>
`

          compilation.emitAsset('webview-bundle.html', new webpack.sources.RawSource(html))
        }
      )
    })
  }
}

/**
 * Mirrors the worker bundle to the Android assets dir so it ships in the APK.
 * iOS uses the webpack output path directly (folder-referenced from Xcode).
 */
class MirrorToAndroidAssetsPlugin {
  constructor({ sourceDir, targetDir }) {
    this.sourceDir = sourceDir
    this.targetDir = targetDir
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap('MirrorToAndroidAssetsPlugin', (compilation) => {
      try {
        fs.mkdirSync(this.targetDir, { recursive: true })
        for (const name of ['webview-bundle.js', 'webview-bundle.html']) {
          const src = path.join(this.sourceDir, name)
          if (!fs.existsSync(src)) continue
          fs.copyFileSync(src, path.join(this.targetDir, name))
        }
      } catch (err) {
        compilation.errors.push(new Error(`MirrorToAndroidAssetsPlugin failed: ${err.message}`))
      }
    })
  }
}

/**
 * Emits `webview-bundle-ota.json` ({ html, js, integrity }) into the services dir so the
 * worker bundle rides the Metro/OTA JS bundle - the native asset copy cannot be OTA-updated.
 * At runtime materializeWorkerBundle writes it to a writable dir and loads it via `file://`.
 */
class EmitOtaBundleJsonPlugin {
  constructor({ sourceDir, targetDir }) {
    this.sourceDir = sourceDir
    this.targetDir = targetDir
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap('EmitOtaBundleJsonPlugin', (compilation) => {
      try {
        const js = fs.readFileSync(path.join(this.sourceDir, 'webview-bundle.js'))
        const html = fs.readFileSync(path.join(this.sourceDir, 'webview-bundle.html'), 'utf8')
        // Same SHA-384 the HTML's SRI uses; doubles as the materialization version marker.
        const integrity = `sha384-${crypto.createHash('sha384').update(js).digest('base64')}`
        const json = JSON.stringify({ html, js: js.toString('utf8'), integrity })
        fs.writeFileSync(path.join(this.targetDir, 'webview-bundle-ota.json'), json)
      } catch (err) {
        compilation.errors.push(new Error(`EmitOtaBundleJsonPlugin failed: ${err.message}`))
      }
    })
  }
}

/**
 * Configuration 1: WebView Worker
 * Background instance that runs the wallet's controllers.
 *
 * Prod: bundle written to `ios/Ambire/Resources/webview/`, mirrored to Android
 * assets, loaded from disk via `file://` (WKWebView stream-parses and caches
 * bytecode). Dev: served from webpack-dev-server (HTTP) for HMR.
 */
const workerConfig = {
  name: 'worker',
  context: ROOT_DIR,
  entry: './src/mobile/modules/webview/services/injectedLogic.ts',
  mode: isDev ? 'development' : 'production',
  target: 'web',
  devtool: false,
  output: {
    path: isDev ? path.resolve(ROOT_DIR, 'src/mobile/modules/webview/services') : IOS_WEBVIEW_DIR,
    filename: 'webview-bundle.js',
    libraryTarget: 'window',
    publicPath: isDev ? '/' : ''
  },
  resolve: sharedResolve,
  module: { rules: sharedRules },
  plugins: [
    ...sharedPlugins,
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(isDev),
      'process.env': JSON.stringify({
        ...process.env,
        WEB_ENGINE: 'webview',
        APP_ENV: isDev ? 'development' : 'production'
      })
    })
  ]
}

if (!isDev) {
  workerConfig.plugins.push(
    new WorkerHtmlPlugin(),
    new MirrorToAndroidAssetsPlugin({
      sourceDir: IOS_WEBVIEW_DIR,
      targetDir: ANDROID_WEBVIEW_DIR
    }),
    // Also ship the worker bundle inside the Metro/OTA bundle so OTA can update it.
    new EmitOtaBundleJsonPlugin({
      sourceDir: IOS_WEBVIEW_DIR,
      targetDir: SERVICES_DIR
    })
  )
}

// Dev-only plugins for Worker (HtmlWebpackPlugin)
if (isDev) {
  workerConfig.plugins.push(
    new HtmlWebpackPlugin({
      templateContent: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script>
              window.onerror = function(msg, url, lineNo, columnNo, error) {
                var errMessage = error ? error.stack || error.message : msg;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ctrl.error',
                  payload: { ctrlName: 'Global', errors: [{ message: errMessage, url: url, lineNo: lineNo }] }
                }));
                return false;
              };
            </script>
          </head>
          <body></body>
        </html>`,
      inject: 'body'
    })
  )

  workerConfig.devServer = {
    port: 8182,
    // Both HMR and live reload are disabled. The WebView loads inline HTML
    // from a file:/// base URL, so location.reload() navigates to file:///
    // (a directory) instead of reloading the page.
    // Reload is handled by the WebSocket monkey-patch in WebViewWorker.tsx:
    // it detects webpack "hash changed" messages and tells RN to remount
    // the WebView, which re-fetches the latest bundle from this server.
    hot: false,
    liveReload: false,
    // Allow connections from mobile devices/emulators
    host: '0.0.0.0',
    allowedHosts: 'all',
    headers: { 'Access-Control-Allow-Origin': '*' },
    client: {
      // Overlay errors inside the WebView for easy debugging
      overlay: true,
      // WebSocket connects back to the correct host
      webSocketURL: 'auto://0.0.0.0:0/ws'
    }
  }
} else {
  workerConfig.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        // Mangle local variable + function names to shrink the worker bundle
        // (cuts both the disk-fetch and the JS parse/eval cost on cold start —
        // the dominant boot bottleneck on low-end devices). `keep_classnames`
        // MUST stay: the controller pipeline derives every controller's identity
        // from `this.constructor.name` (eventEmitter.ts `get name()`), and code
        // like criticalControllers, buildStateForFE and transactionManager keys
        // off those exact class-name strings — mangling them breaks the app.
        terserOptions: { mangle: { keep_classnames: true }, keep_classnames: true }
      })
    ],
    splitChunks: false,
    runtimeChunk: false
  }
}

/**
 * Configuration 2: Inpage Provider
 * The Ethereum provider injected into dapps.
 */
const inpageConfig = {
  name: 'inpage',
  context: ROOT_DIR,
  entry: {
    'ambire-inpage': './src/mobile/modules/inpage/ambire-inpage.ts',
    'ethereum-inpage': './src/mobile/modules/inpage/ethereum-inpage.ts'
  },
  mode: isDev ? 'development' : 'production',
  target: 'web',
  devtool: isDev ? 'inline-source-map' : false,
  output: {
    path: path.resolve(ROOT_DIR, 'src/mobile/modules/webview/services'),
    filename: '[name]-bundle.js',
    libraryTarget: 'window',
    publicPath: isDev ? '/' : ''
  },
  resolve: sharedResolve,
  module: { rules: sharedRules },
  plugins: [
    ...sharedPlugins,
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(isDev),
      'process.env.WEB_ENGINE': JSON.stringify('webview'),
      'process.env.APP_ENV': JSON.stringify(isDev ? 'development' : 'production'),
      globalIsAmbireNext: false,
      // AMBIRE_PROVIDER_NONCE is prepended at runtime in RN.
      AMBIRE_PROVIDER_NONCE: 'AMBIRE_PROVIDER_NONCE'
    }),
    new JsonWrapPlugin({ assetName: 'ambire-inpage-bundle.js' }),
    new JsonWrapPlugin({ assetName: 'ethereum-inpage-bundle.js' })
  ]
}

if (!isDev) {
  inpageConfig.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: { mangle: false, keep_classnames: true, keep_fnames: true }
      })
    ],
    splitChunks: false,
    runtimeChunk: false
  }
}

module.exports = [workerConfig, inpageConfig]
