/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path')

// Loaded here too (not only in ./shared), because this module is also required by
// standalone node scripts that never go through the webpack config.
require('dotenv').config()

const ROOT_DIR = path.resolve(__dirname, '..')

const isWebkit = process.env.WEB_ENGINE?.startsWith('webkit')
const isGecko = process.env.WEB_ENGINE === 'gecko'
const isSafari = process.env.WEB_ENGINE === 'webkit-safari'
// anon-rpc's MV3 harness needs the chrome.offscreen API, which only Chromium
// browsers implement (not Safari, and Firefox has no offscreen documents).
const isAnonRpcSupported = isWebkit && !isSafari
const outputPath = process.env.WEBPACK_BUILD_OUTPUT_PATH || ''
const isExtension =
  outputPath.includes('webkit') || outputPath.includes('gecko') || outputPath.includes('safari')
const isAmbireExplorer = outputPath.includes('benzin')
const isLegends = outputPath.includes('legends')
const isAmbireNext = process.env.AMBIRE_NEXT === 'true'

// The folder that holds every build output. Defaults to <repo root>/build, but BUILD_DIR
// can point it at any folder on the machine. Handy with git worktrees: build every worktree
// into one fixed folder, so an extension loaded from it only needs a reload, not a re-import.
const buildDir = process.env.BUILD_DIR
  ? path.resolve(process.env.BUILD_DIR)
  : path.join(ROOT_DIR, 'build')
// Where the current build writes, e.g. <buildDir>/webkit-dev
const buildOutputDir = path.join(buildDir, outputPath)

module.exports = {
  isWebkit,
  isGecko,
  isSafari,
  isAnonRpcSupported,
  outputPath,
  isExtension,
  isAmbireExplorer,
  isLegends,
  isAmbireNext,
  buildDir,
  buildOutputDir
}
