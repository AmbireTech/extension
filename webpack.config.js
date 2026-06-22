const { createBaseConfig } = require('./webpack/shared')
const { isExtension, isAmbireExplorer, isLegends } = require('./webpack/env')
const buildExtension = require('./webpack/extension')
const buildBenzin = require('./webpack/benzin')
const buildLegends = require('./webpack/legends')

// Expo's CLI (expo start --web / expo export:web) loads this file as its webpack
// config. It builds the shared base config, then delegates to the per-environment
// module selected by WEBPACK_BUILD_OUTPUT_PATH (see ./webpack/env.js).
module.exports = async function (env, argv) {
  const base = await createBaseConfig(env, argv)

  if (isExtension) return buildExtension(base, env)
  if (isAmbireExplorer) return buildBenzin(base)
  if (isLegends) return buildLegends(base)

  // @TODO: Add mobile app build configuration here
  throw new Error('Invalid WEBPACK_BUILD_OUTPUT_PATH')
}
