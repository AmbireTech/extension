module.exports = function (api) {
  const isLegends = process.env.WEBPACK_BUILD_OUTPUT_PATH?.includes('legends')
  api.cache(true)

  const pathAliases = {
    '@ambire-common': './src/ambire-common/src',
    '@contracts': './src/ambire-common/contracts',
    // v1 is legacy and should be removed when v1 imports are replaced with @ambire-common
    '@ambire-common-v1': './src/ambire-common/v1',
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
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
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
            // alias for better crypto performance on mobile
            'scrypt-js': './src/common/config/alias/scrypt.js',
            // alias for better crypto performance on mobile
            '@ethersproject/pbkdf2': './src/common/config/alias/pbkdf2.js',
            // node's crypto polyfill for React Native
            crypto: 'react-native-quick-crypto',
            // stream-browserify: used by react-native-quick-crypto
            stream: 'stream-browserify',
            // @craftzdog/react-native-buffer: used by react-native-quick-crypto
            buffer: '@craftzdog/react-native-buffer',

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
