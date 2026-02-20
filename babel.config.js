module.exports = function (api) {
  const isLegends = process.env.WEBPACK_BUILD_OUTPUT_PATH?.includes('legends')
  api.cache(true)

  const pathAliases = {
    '@ambire-common': './src/ambire-common/src',
    '@contracts': './src/ambire-common/contracts',
    '@common': './src/common',
    '@mobile': './src/mobile',
    '@web': './src/web',
    '@benzin': './src/benzin',
    '@legends': './src/legends'
  }

  const config = {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-transform-export-namespace-from'],
      ['transform-inline-environment-variables'],
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env'
        }
      ],
      ['react-native-worklets/plugin', { relativeSourceLocation: true }]
    ]
  }

  const webConfig = {
    ...config,
    plugins: [
      ...config.plugins,
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.ios.tsx',
            '.android.tsx',
            '.tsx',
            '.jsx',
            '.js',
            '.json'
          ],
          alias: pathAliases
        }
      ]
    ]
  }

  if (isLegends) {
    webConfig.presets = [...webConfig.presets, '@babel/preset-react', '@babel/preset-typescript']
  }

  const mobileConfig = {
    ...config,
    plugins: [
      ...config.plugins,
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.ios.tsx',
            '.android.tsx',
            '.tsx',
            '.jsx',
            '.js',
            '.json'
          ],
          alias: {
            crypto: 'react-native-quick-crypto',
            stream: 'readable-stream',
            buffer: 'buffer',
            http: 'stream-http',
            https: 'https-browserify',
            zlib: 'browserify-zlib',

            // absolute imports
            ...pathAliases
          }
        }
      ]
    ]
  }

  const isMobile =
    !process.env.WEB_ENGINE &&
    !process.env.WEBPACK_BUILD_OUTPUT_PATH?.includes('benzin') &&
    !process.env.WEBPACK_BUILD_OUTPUT_PATH?.includes('legends')

  return isMobile ? mobileConfig : webConfig
}
