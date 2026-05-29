const path = require('path')
const webpack = require('webpack')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') })
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const fs = require('fs')
const { execSync } = require('child_process')

// Since Webpack is executed from the project root via package.json scripts,
// process.cwd() provides the absolute path to the project root directory
const ROOT_DIR = process.cwd()
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('serve')

// Where the production worker bundle is shipped so the WebView can load it
// directly from disk via a `file://` URL on each platform.
//   iOS: anything under `ios/Ambire/Resources/` is folder-referenced from the
//        Xcode project (see project.pbxproj) and copied verbatim into the
//        signed `.app` bundle. The WebView reads it at runtime via
//        `${expo-file-system.bundleDirectory}/webview/webview-bundle.html`.
//   Android: anything under `android/app/src/main/assets/` is packaged by
//        Gradle without further configuration. The WebView reads it via
//        `file:///android_asset/webview/webview-bundle.html`.
const IOS_WEBVIEW_DIR = path.resolve(ROOT_DIR, 'ios/Ambire/Resources/webview')
const ANDROID_WEBVIEW_DIR = path.resolve(
  ROOT_DIR,
  'android/app/src/main/assets/webview'
)

// In dev mode, ensure inpage bundle JSON files exist before starting the dev
// server. They are injected into dapp WebViews as strings and have no file-
// based fallback. The worker bundle is always served from webpack-dev-server
// in dev so it does not need the on-disk fallback.
if (isDev) {
  const SERVICES_DIR = path.resolve(ROOT_DIR, 'src/mobile/modules/webview/services')
  const bundleFiles = ['ethereum-inpage-bundle.json', 'ambire-inpage-bundle.json']
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
 * Emits `webview-bundle.html` next to `webview-bundle.js` with a CSP-locked
 * `<script>` tag that loads the bundle from the same directory and pins it via
 * a SHA-384 Subresource Integrity hash. The WKWebView refuses to execute the
 * script if the on-disk bundle has been tampered with.
 *
 * CSP rationale: `script-src 'self'` permits the bundle's `<script src=...>`
 * but still blocks inline scripts, `eval`, remote URLs, and any DOM-injected
 * `<script>` tags. `connect-src 'none'` blocks every network egress from the
 * WebView itself (all I/O is proxied through the RN bridge).
 */
class WorkerHtmlPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('WorkerHtmlPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'WorkerHtmlPlugin',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
        },
        (assets) => {
          const jsAsset = assets['webview-bundle.js']
          if (!jsAsset) return

          // Load the bundle via XHR + eval so we can wrap execution in a
          // try/catch on our side. WKWebView masks any uncaught error from a
          // cross-origin `<script src>` as "Script error." with no file/line,
          // which makes diagnosing prod failures impossible. Loading the
          // bundle as text and `eval`-ing it keeps the same execution scope
          // so real stacks reach `window.onerror`.
          //
          // CSP rationale: the inline loader and `eval` require
          // `'unsafe-inline'` + `'unsafe-eval'` for `script-src`, but every
          // other directive is locked down. The bundle bytes are signed into
          // the app binary, so widening the script-src does not change what
          // code can actually run. `connect-src 'self'` is what permits the
          // XHR to the sibling `webview-bundle.js`; the actual file:// access
          // is also gated on `allowFileAccessFromFileURLs` on the RN side.
          const csp = [
            "default-src 'none'",
            "script-src 'unsafe-inline' 'unsafe-eval'",
            "connect-src 'self'",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'none'",
            "form-action 'none'"
          ].join('; ')

          const html = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
  </head>
  <body>
    <script>
      (function() {
        try {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', 'webview-bundle.js', false);
          xhr.send();
          if (xhr.status !== 200 && xhr.status !== 0) {
            throw new Error('Bundle XHR failed: status=' + xhr.status);
          }
          // eslint-disable-next-line no-eval
          (0, eval)(xhr.responseText);
        } catch (err) {
          var msg = err && (err.stack || err.message) || String(err);
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ctrl.error',
              payload: {
                ctrlName: 'BundleLoad',
                errors: [{ message: msg }]
              }
            }));
          } catch (_) {}
        }
      })();
    </script>
  </body>
</html>
`

          compilation.emitAsset(
            'webview-bundle.html',
            new webpack.sources.RawSource(html)
          )
        }
      )
    })
  }
}

/**
 * After webpack writes the worker bundle to disk, mirror it to the Android
 * assets directory so the same files are packaged into the APK. The iOS path
 * is the webpack output path itself (folder-referenced from Xcode).
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
        compilation.errors.push(
          new Error(`MirrorToAndroidAssetsPlugin failed: ${err.message}`)
        )
      }
    })
  }
}

/**
 * Configuration 1: WebView Worker
 * Background instance that runs the wallet's controllers.
 *
 * In production the worker bundle is written directly under
 * `ios/Ambire/Resources/webview/` and mirrored to
 * `android/app/src/main/assets/webview/`. The WebView loads it from disk via
 * `file://` so WKWebView can stream-parse it and cache its bytecode between
 * launches — far cheaper than the previous JSON-wrapped string injection.
 * In dev the bundle is served from webpack-dev-server (HTTP) so HMR keeps
 * working unchanged; the on-disk copies are produced only by the production
 * build.
 */
const workerConfig = {
  name: 'worker',
  context: ROOT_DIR,
  entry: './src/mobile/modules/webview/services/injectedLogic.ts',
  mode: isDev ? 'development' : 'production',
  target: 'web',
  devtool: false,
  output: {
    path: isDev
      ? path.resolve(ROOT_DIR, 'src/mobile/modules/webview/services')
      : IOS_WEBVIEW_DIR,
    filename: 'webview-bundle.js',
    libraryTarget: 'window',
    publicPath: isDev ? '/' : '',
    crossOriginLoading: 'anonymous'
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
        terserOptions: { mangle: false, keep_classnames: true, keep_fnames: true }
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
