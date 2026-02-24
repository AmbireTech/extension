;(function () {
  const originalRepair = globalThis.repairIntrinsics
  if (typeof originalRepair !== 'function') return

  globalThis.repairIntrinsics = function patchedRepairIntrinsics(opts) {
    originalRepair.call(this, opts)

    try {
      const originalWarn =
        globalThis.console && typeof globalThis.console.warn === 'function'
          ? globalThis.console.warn
          : function () {}

      const SUPPRESSED_WARNINGS = [
        'No routes matched location',
        'setNativeProps is deprecated. Please update props using React state instead.',
        'Animated: `useNativeDriver` is not supported because the native animated module is missing. Falling back to JS-based animation.'
      ]

      // Replace console.warn with a filtered version
      globalThis.console.warn = function filteredConsoleWarn(msg) {
        try {
          if (typeof msg === 'string') {
            const shouldSuppress = SUPPRESSED_WARNINGS.some(function (entry) {
              return msg.indexOf(entry) !== -1
            })
            if (shouldSuppress) {
              return
            }
          }
        } catch {
          // If anything goes wrong with filtering, fall back to the original warn
        }

        return originalWarn.apply(this, arguments)
      }
    } catch (e) {
      try {
        const fallbackWarn =
          globalThis.console && typeof globalThis.console.warn === 'function'
            ? globalThis.console.warn
            : null
        if (fallbackWarn) {
          fallbackWarn('[ConsoleWarnShim] failed:', e)
        }
      } catch {
        // Swallow any errors from logging the shim failure
      }
    }
  }
})()
