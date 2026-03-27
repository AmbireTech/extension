const path = require('path')
const webpack = require('webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

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
  resolve: {
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
      'scrypt-js': require.resolve('scrypt-js'),
      pbkdf2: require.resolve('pbkdf2'),
      '@react-native-community/netinfo': false,
      'react-native-mmkv': false
    }
  },
  module: {
    rules: [
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
                ['@babel/preset-env', { targets: 'defaults', modules: false }],
                '@babel/preset-typescript',
                ['@babel/preset-react', { runtime: 'automatic' }]
              ],
              plugins: [
                ['@babel/plugin-proposal-decorators', { legacy: true }],
                ['@babel/plugin-transform-class-properties', { loose: true }],
                ['@babel/plugin-transform-private-methods', { loose: true }],
                ['@babel/plugin-transform-private-property-in-object', { loose: true }]
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
  },
  plugins: [
    new NodePolyfillPlugin(),
    new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' }),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production' || true),
      'process.env.WEB_ENGINE': JSON.stringify('webview'),
      'process.env.APP_ENV': JSON.stringify('development')
    })
  ]
}
