const isWebkit = process.env.WEB_ENGINE?.startsWith('webkit')
const isGecko = process.env.WEB_ENGINE === 'gecko'
const isSafari = process.env.WEB_ENGINE === 'webkit-safari'
const outputPath = process.env.WEBPACK_BUILD_OUTPUT_PATH
const isExtension =
  outputPath.includes('webkit') || outputPath.includes('gecko') || outputPath.includes('safari')
const isAmbireExplorer = outputPath.includes('benzin')
const isLegends = outputPath.includes('legends')
const isAmbireNext = process.env.AMBIRE_NEXT === 'true'

module.exports = {
  isWebkit,
  isGecko,
  isSafari,
  outputPath,
  isExtension,
  isAmbireExplorer,
  isLegends,
  isAmbireNext
}
