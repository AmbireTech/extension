const { readFileSync } = require('fs')

/**
 * Webpack plugin that injects a filtered console.warn shim BEFORE SES
 * hardens intrinsics, so it works reliably inside LavaMoat Compartments.
 *
 * The actual shim logic lives in console-warn-shim.js and is injected
 * as-is into the SES-instrumented chunks (background.js and main.js),
 * right after the SES marker comment that denotes the end of the SES prelude.
 */
function createConsoleWarnShimPlugin() {
  return {
    apply(compiler) {
      const {
        Compilation,
        sources: { RawSource }
      } = compiler.webpack

      const consoleWarnShimSource = readFileSync(require.resolve('./console-warn-shim.js'), 'utf-8')

      compiler.hooks.thisCompilation.tap('ConsoleWarnShimPlugin', (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: 'ConsoleWarnShimPlugin',
            stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE + 1
          },
          () => {
            for (const file in compilation.assets) {
              if (!/^(background|main)(-.*)?\.js$/.test(file)) continue

              const source = compilation.assets[file].source()
              const marker = '/*! end SES */'
              const idx = source.indexOf(marker)
              if (idx === -1) continue

              const insertPos = idx + marker.length
              const shimCode = '\n' + consoleWarnShimSource + '\n'

              compilation.assets[file] = new RawSource(
                source.slice(0, insertPos) + shimCode + source.slice(insertPos)
              )
            }
          }
        )
      })
    }
  }
}

module.exports = createConsoleWarnShimPlugin
