const path = require('path')
const webpack = require('webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('serve')

const sharedResolve = {
  extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.web.js', '.js', '.jsx'],
  fallback: {
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify'),
    buffer: require.resolve('buffer')
  },
  alias: {
    '@ambire-common': path.resolve(__dirname, 'src/ambire-common/src'),
    '@common': path.resolve(__dirname, 'src/common'),
    '@mobile': path.resolve(__dirname, 'src/mobile'),
    '@web': path.resolve(__dirname, 'src/web'),
    react: path.resolve(__dirname, 'node_modules/react'),
    'react-native$': 'react-native-web',
    'react-native-quick-crypto': 'crypto-browserify',
    'react-native-quick-base64': 'buffer',
    'scrypt-js': path.resolve(__dirname, 'src/mobile/shims/scrypt-js.ts'),
    pbkdf2: path.resolve(__dirname, 'src/mobile/shims/pbkdf2.ts'),
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
  new webpack.DefinePlugin({
    __DEV__: JSON.stringify(isDev),
    'process.env.WEB_ENGINE': JSON.stringify('webview'),
    'process.env.APP_ENV': JSON.stringify(isDev ? 'development' : 'production')
  })
]

// ── Development config (webpack-dev-server with HMR) ──
if (isDev) {
  module.exports = {
    entry: './src/mobile/services/WebViewWorker/injectedLogic.ts',
    mode: 'development',
    target: 'web',
    devtool: 'eval-source-map',
    output: {
      path: path.resolve(__dirname, 'dist-webview-dev'),
      filename: 'webview-bundle.js',
      publicPath: '/'
    },
    devServer: {
      port: 8082,
      // Use live reload (full page reload) instead of HMR.
      // injectedLogic.ts is a stateful entry point (controllers, event listeners)
      // that cannot be hot-patched in place — a clean reload is required.
      hot: false,
      liveReload: true,
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
      // Generate an index.html that loads the bundle via <script> tags
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
    ],
    optimization: {
      splitChunks: false,
      runtimeChunk: false
    }
  }
} else {
  // ── Production config (existing bundle build) ──
  module.exports = {
    entry: './src/mobile/services/WebViewWorker/injectedLogic.ts',
    mode: 'production',
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'src/mobile/services/WebViewWorker'),
      filename: 'webview-bundle.js',
      libraryTarget: 'window',
      publicPath: ''
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
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
      })
    ]
  }
}
