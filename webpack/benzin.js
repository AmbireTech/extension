/* eslint-disable @typescript-eslint/no-require-imports */
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const { CJS_RULE, hardenTerser } = require('./shared')
const { fetchRelayerNetworks, RELAYER_NETWORKS_GLOBAL } = require('./relayerNetworks')

module.exports = async function buildBenzin({ config, defaultExpoConfigPlugins }) {
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
    new webpack.DefinePlugin({
      [RELAYER_NETWORKS_GLOBAL]: JSON.stringify(await fetchRelayerNetworks())
    }),
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
        // Token and network icons from @ambire/token-and-network-icons, copied next to the pages and
        // loaded by path (see getBundledIconUri.ts), so they stay out of the JS
        {
          from: './node_modules/@ambire/token-and-network-icons/assets/tokenIcons',
          to: 'tokenIcons'
        },
        {
          from: './node_modules/@ambire/token-and-network-icons/assets/networkIcons',
          to: 'networkIcons'
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
        },
        {
          from: './src/benzin/public/robots.txt',
          to: 'robots.txt'
        },
        {
          from: './src/benzin/public/og',
          to: 'og'
        }
      ]
    })
  ]

  config.module.rules.push(CJS_RULE)

  return config
}
