module.exports = function (api) {
  api.cache(true)

  const config = {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-proposal-export-namespace-from'],
      ['transform-inline-environment-variables'],
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env'
        }
      ],
      ['react-native-reanimated/plugin']
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
          alias: {
            // absolute imports
            '@common': './src/common',
            '@mobile': './src/mobile',
            '@web': './src/web'
          }
        }
      ]
    ]
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
            '@common': './src/common',
            '@mobile': './src/mobile',
            '@web': './src/web'
          }
        }
      ]
    ]
  }

  const isMobile = !process.env.WEB_ENGINE

  return isMobile ? mobileConfig : webConfig
}
