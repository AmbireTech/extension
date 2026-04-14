const path = require('path')
const webpack = require('webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

// Since Webpack is executed from the project root via package.json scripts,
// process.cwd() provides the absolute path to the project root directory
const ROOT_DIR = process.cwd()

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('serve')

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

const sharedRules = [
  {
    test: /\.(js|jsx|ts|tsx|mjs)$/,
    // Exclude Node modules EXCEPT for the core libraries that have ESM/TS syntax
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

const sharedPlugins = [
  new NodePolyfillPlugin(),
  new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' }),
  new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  new webpack.DefinePlugin({
    __DEV__: JSON.stringify(isDev),
    'process.env.WEB_ENGINE': JSON.stringify('webview'),
    'process.env.APP_ENV': JSON.stringify(isDev ? 'development' : 'production')
  })
]

// ── Development config (webpack-dev-server with HMR) ──
if (isDev) {
  module.exports = {
    context: ROOT_DIR,
    entry: './src/mobile/services/WebViewWorker/injectedLogic.ts',
    mode: 'development',
    target: 'web',
    devtool: 'eval-source-map',
    output: {
      path: path.resolve(ROOT_DIR, 'dist-webview-dev'),
      filename: 'webview-bundle.js',
      publicPath: '/'
    },
    devServer: {
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
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      client: {
        // Overlay errors inside the WebView for easy debugging
        overlay: true,
        // WebSocket connects back to the correct host
        webSocketURL: 'auto://0.0.0.0:0/ws'
      }
    },
    resolve: sharedResolve,
    module: { rules: sharedRules },
    plugins: [
      ...sharedPlugins,
      // Generate an index.html that loads the bundle via <script> tags.
      // Includes security patches (fetch/XHR file:// blocking) and the
      // WebSocket URL fix since the WebView loads this page directly.
      new HtmlWebpackPlugin({
        templateContent: `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>
      // 1. Monkey-patch fetch to block file:// requests
      var _originalFetch = window.fetch;
      window.fetch = function() {
        var url = arguments[0];
        if (typeof url === 'string' && url.indexOf('file://') === 0) {
          return Promise.reject(new Error('fetch to file:// is blocked for security.'));
        }
        if (url && typeof url === 'object' && url.url && url.url.indexOf('file://') === 0) {
          return Promise.reject(new Error('fetch to file:// is blocked for security.'));
        }
        return _originalFetch.apply(this, arguments);
      };

      // 2. Monkey-patch XHR to block file:// requests
      var _originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url) {
        if (typeof url === 'string' && url.indexOf('file://') === 0) {
          throw new Error('XHR to file:// is blocked for security.');
        }
        return _originalOpen.apply(this, arguments);
      };

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
    ],
    optimization: {
      splitChunks: false,
      runtimeChunk: false
    }
  }
} else {
  class JsonWrapPlugin {
    apply(compiler) {
      compiler.hooks.emit.tap('JsonWrapPlugin', (compilation) => {
        // Only wrap in JSON for production
        if (compilation.options.mode !== 'production') return

        const assetName = 'webview-bundle.js'
        const asset = compilation.assets[assetName]
        if (asset) {
          const code = asset.source().toString()
          const jsonCode = JSON.stringify({ code })

          // Add the JSON asset
          compilation.assets['webview-bundle.json'] = {
            source: () => jsonCode,
            size: () => jsonCode.length
          }

          // Remove the JS and LICENSE files so they don't get written to disk
          delete compilation.assets[assetName]
          delete compilation.assets[`${assetName}.LICENSE.txt`]
        }
      })
    }
  }

  // ── Production config (existing bundle build) ──
  module.exports = {
    context: ROOT_DIR,
    entry: './src/mobile/services/WebViewWorker/injectedLogic.ts',
    mode: 'production',
    target: 'web',
    output: {
      path: __dirname,
      filename: 'webview-bundle.js',
      libraryTarget: 'window',
      publicPath: ''
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            mangle: false,
            keep_classnames: true,
            keep_fnames: true
          }
        })
      ],
      splitChunks: false,
      runtimeChunk: false
    },
    resolve: sharedResolve,
    module: { rules: sharedRules },
    plugins: [
      ...sharedPlugins,
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(false),
        'process.env.WEB_ENGINE': JSON.stringify('webview'),
        'process.env.APP_ENV': JSON.stringify('production')
      }),
      new JsonWrapPlugin()
    ]
  }
}
