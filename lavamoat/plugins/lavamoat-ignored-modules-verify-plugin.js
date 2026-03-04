/**
 * Post-build verification for LavaMoat "ignored module ids" warning.
 *
 * When LavaMoat reports that some module ids can't be controlled by policy
 * and must be ignored at runtime, this plugin:
 *  - parses those ids from the original LavaMoat warning
 *  - scans all emitted .js bundles for their module definitions
 *  - verifies that each such module is effectively empty (ID:()=>{})
 *  - appends a ✅ / ❌ status line and short explanation back to the same warning.
 *
 * The goal is to make it explicit when ignored modules are just
 * tree‑shaken/asset placeholders (safe), and to surface any case where
 * executable code ends up outside LavaMoat policy (unsafe).
 */
const fs = require('fs')
const path = require('path')

function getAllJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return getAllJsFiles(full)
    if (e.isFile() && full.endsWith('.js')) return [full]
    return []
  })
}

function isIdEmptyInCode(code, id) {
  const idPattern = `${id}:`
  if (!code.includes(idPattern)) return true
  const re = new RegExp(`${id}:\\(\\)=>\\{\\}`, 'g')
  return re.test(code)
}

class LavamoatIgnoredModulesVerifyPlugin {
  constructor(options = {}) {
    this.outputDir =
      options.outputDir ||
      path.join(process.cwd(), 'build', process.env.WEBPACK_BUILD_OUTPUT_PATH || 'webkit-prod')
  }

  apply(compiler) {
    compiler.hooks.done.tap('LavamoatIgnoredModulesVerifyPlugin', (stats) => {
      const compilation = stats.compilation
      const warnings = compilation.warnings || []

      const lavaWarning = warnings.find((w) => {
        const msg = String(w.message || w)
        return msg.includes(
          "LavaMoatPlugin: the following module ids can't be controlled by policy and must be ignored at runtime"
        )
      })

      if (!lavaWarning) return

      const msg = String(lavaWarning.message || lavaWarning)
      const ids = Array.from(new Set((msg.match(/\b\d+\b/g) || []).map((n) => Number(n))))
      if (!ids.length) return

      const files = getAllJsFiles(this.outputDir)
      let allEmpty = true
      const bad = []

      for (const file of files) {
        const code = fs.readFileSync(file, 'utf8')
        for (const id of ids) {
          if (!isIdEmptyInCode(code, id)) {
            allEmpty = false
            bad.push({ id, file })
          }
        }
      }

      const suffix = allEmpty
        ? '\n✅ All ignored module IDs are empty (ID:()=>{}). ' +
          'This usually means their original code was fully tree-shaken (unused) ' +
          'or represents assets/placeholders, so there is no executable logic left to sandbox.'
        : '\n❌ Some ignored module IDs are NOT empty. ' +
          'These modules still contain executable code but are not covered by LavaMoat policy, ' +
          'so they should be reviewed: ' +
          bad.map((b) => `${b.id} in ${path.relative(process.cwd(), b.file)}`).join(', ')

      if (lavaWarning.message) {
        lavaWarning.message += suffix
      } else {
        const idx = warnings.indexOf(lavaWarning)
        if (idx !== -1) {
          warnings[idx] = msg + suffix
        }
      }
    })
  }
}

module.exports = LavamoatIgnoredModulesVerifyPlugin
