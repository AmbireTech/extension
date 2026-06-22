/* eslint-disable @typescript-eslint/no-require-imports */
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const { CJS_RULE, hardenTerser } = require('./shared')

module.exports = function buildBenzin({ config, defaultExpoConfigPlugins }) {
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

  hardenTerser(config)

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

  config.module.rules.push(CJS_RULE)

  return config
}
