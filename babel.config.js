module.exports = function (api) {
  const isLegends = process.env.WEBPACK_BUILD_OUTPUT_PATH?.includes('legends')
  api.cache(true)

  const pathAliases = {
    '@': './src/ambire-common/src',
    '@test': './src/ambire-common/test',
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
      // Required for @Reflect.metadata() decorators on class properties (e.g. ProviderController).
      // Must run after the decorators transform, and use loose: true to match legacy decorator mode.
      // Not included in mobile config as Hermes handles class properties natively and these cause issues there.
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
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
            // Lazy load eth-crypto to prevent load-time errors in the Hermes engine
            'eth-crypto': './src/mobile/shims/eth-crypto',
            // Shim scrypt-js to use native implementations, drastically improving keystore performance
            'scrypt-js': './src/mobile/shims/scrypt-js',
            // Shim pbkdf2 to use native implementations for better performance during wallet operations
            pbkdf2: './src/mobile/shims/pbkdf2',
            // Use react-native-quick-crypto for high-performance native crypto operations instead of slow JS polyfills
            crypto: 'react-native-quick-crypto',
            // Polyfill Node.js built-ins for compatibility with libraries using Node.js features (e.g. ethers.js, stream-based libs)
            stream: 'readable-stream',
            // Provide Buffer global for cryptographic and binary data processing
            buffer: 'buffer',
            // Redirect http/https to browser-compatible versions for networking libraries
            http: 'stream-http',
            https: 'https-browserify',
            // Provide compression support for libraries requiring Node's zlib
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
