/**
 * Unsafe-layer plugin for LavaMoat webpack builds.
 *
 * Background:
 * - LavaMoat protection has two different phases:
 *   1) Build-time module wrapping (Compartment wrapper code around modules)
 *   2) Runtime injection (safe/unlocked/null runtime bootstrapping per chunk)
 * - Setting chunk mode to `null_unsafe` only affects phase (2): runtime injection.
 *   It does NOT automatically disable build-time module wrapping.
 *
 * Why this plugin is required:
 * - If a chunk is `null_unsafe` but its modules are still wrapped, that chunk may
 *   reference LavaMoat runtime symbols that are no longer injected, which can break
 *   execution.
 * - To make an entry truly run outside LavaMoat, we must also mark its modules as
 *   excluded from wrapping.
 *
 * What this plugin does:
 * 1) Adds a webpack rule: issuerLayer='unsafe' + LavaMoat.exclude loader.
 *    This marks modules as excluded from LavaMoat wrapping.
 * 2) Assigns `entry.options.layer = 'unsafe'` for selected entry names.
 *
 * Expected usage:
 * - Combine this plugin with `runtimeConfigurationPerChunk_experimental` returning
 *   `{ mode: 'null_unsafe' }` for the same entry names.
 * - The result is a plain webpack bundle for those entries: no LavaMoat runtime and
 *   no LavaMoat module wrapping.
 */
function createLavamoatUnsafeLayerPlugin(unsafeEntryNames) {
  const { exclude } = require('@lavamoat/webpack')

  const unsafeEntries =
    unsafeEntryNames instanceof Set ? unsafeEntryNames : new Set(unsafeEntryNames || [])

  const lavamoatUnsafeLayerRule = {
    issuerLayer: 'unsafe',
    use: exclude
  }

  return {
    apply(compiler) {
      compiler.options.module.rules.push(lavamoatUnsafeLayerRule)

      compiler.hooks.thisCompilation.tap('LavamoatUnsafeLayer', (compilation) => {
        compilation.hooks.addEntry.tap('LavamoatUnsafeLayer', (entry, options) => {
          const name = options?.name
          if (!name || !unsafeEntries.has(name)) return

          const entryData = compilation.entries.get(name)
          if (entryData?.options) {
            entryData.options.layer = lavamoatUnsafeLayerRule.issuerLayer
          }
        })
      })
    }
  }
}

module.exports = createLavamoatUnsafeLayerPlugin
