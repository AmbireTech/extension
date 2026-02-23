const { readFileSync } = require('fs')

/**
 * Webpack plugin that injects the npm `setimmediate` polyfill into background.js
 * BETWEEN SES repairIntrinsics() and hardenIntrinsics().
 *
 * Problem: Importing `setimmediate` as a normal module runs too late in a
 * LavaMoat + SES environment — intrinsics are already hardened and modules run
 * in isolated Compartments that do not see the polyfill.
 *
 * Solution: Inject the polyfill after repairIntrinsics() (intrinsics still
 * mutable) but before hardenIntrinsics() (intrinsics frozen). This makes
 * setImmediate / clearImmediate available in the shared intrinsic realm,
 * so all Compartments inherit them.
 *
 *
 *  Note: We include `setImmediate` because ethers / viem cryptographic operations
 *  (e.g. scrypt keystore unlock) rely on it for fast cooperative scheduling —
 *  without it they fall back to slower timers and performance drops significantly.
 *
 *  It is imported in background for development builds, and injected via Webpack
 *  plugin for production where LavaMoat + SES isolate modules and harden intrinsics.
 */
function createSetImmediateShimPlugin() {
  return {
    apply(compiler) {
      const setImmediateSource = readFileSync(require.resolve('setimmediate'), 'utf-8')

      const {
        Compilation,
        sources: { RawSource }
      } = compiler.webpack

      compiler.hooks.thisCompilation.tap('SetImmediateShimPlugin', (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: 'SetImmediateShimPlugin',
            stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE + 1
          },
          () => {
            for (const file in compilation.assets) {
              if (!/^background\.js$/.test(file)) continue

              const source = compilation.assets[file].source()

              // Same marker you already use in the reflect-metadata shim
              const marker = '/*! end SES */'
              const idx = source.indexOf(marker)
              if (idx === -1) continue

              const insertPos = idx + marker.length

              // String concat (not template literals) – npm source may include backticks.
              // We hook repairIntrinsics() so the polyfill runs after SES "repairs" but
              // before hardenIntrinsics() freezes intrinsics.
              const shimCode =
                '\n;(function() {' +
                '\n  var _origRepair = globalThis.repairIntrinsics;' +
                '\n  if (typeof _origRepair === "function") {' +
                '\n    globalThis.repairIntrinsics = function(opts) {' +
                '\n      _origRepair.call(this, opts);' +
                '\n      try {' +
                '\n        // Avoid re-running if something already installed it' +
                '\n        if (typeof globalThis.setImmediate !== "function") {' +
                '\n          (function() {' +
                '\n' +
                setImmediateSource +
                '\n          })();' +
                '\n        }' +
                '\n      } catch(e) { console.warn("[SetImmediateShim] failed:", e); }' +
                '\n    };' +
                '\n  }' +
                '\n})();\n'

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

module.exports = createSetImmediateShimPlugin
