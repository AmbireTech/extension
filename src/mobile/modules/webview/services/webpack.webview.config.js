const path = require('path')
const webpack = require('webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

// Since Webpack is executed from the project root via package.json scripts,
// process.cwd() provides the absolute path to the project root directory
const ROOT_DIR = process.cwd()
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('serve')

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
 * Configuration 1: WebView Worker
 * Background instance that runs the wallet's controllers.
 */
const workerConfig = {
  name: 'worker',
  context: ROOT_DIR,
  entry: './src/mobile/modules/webview/services/injectedLogic.ts',
  mode: isDev ? 'development' : 'production',
  target: 'web',
  devtool: false,
  output: {
    path: path.resolve(ROOT_DIR, 'src/mobile/modules/webview/services'),
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
      'process.env.WEB_ENGINE': JSON.stringify('webview'),
      'process.env.APP_ENV': JSON.stringify(isDev ? 'development' : 'production')
    }),
    new JsonWrapPlugin({ assetName: 'webview-bundle.js' })
  ]
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
    port: 8082,
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
