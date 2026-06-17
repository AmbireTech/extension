/* eslint-disable @typescript-eslint/no-require-imports */
const webpack = require('webpack')
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const { CJS_RULE, hardenTerser, ROOT_DIR } = require('./shared')

module.exports = function buildLegends({ config, defaultExpoConfigPlugins }) {
  config.output.clean = true
  config.entry = './src/legends/index.js'

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
              includePaths: [path.resolve(ROOT_DIR, './src/legends')]
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

  hardenTerser(config)

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
          to: path.resolve(ROOT_DIR, `build/${process.env.WEBPACK_BUILD_OUTPUT_PATH}`), // Destination directory
          globOptions: {
            ignore: ['**/*.html'] // Ignore HTML files as they are handled by HtmlWebpackPlugin
          }
        }
      ]
    })
  ]

  config.module.rules.push(CJS_RULE)

  return config
}
