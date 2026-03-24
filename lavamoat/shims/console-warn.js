function installConsoleWarnFilter(
  suppressedWarnings = [
    'No routes matched location',
    'setNativeProps is deprecated. Please update props using React state instead.',
    'Animated: `useNativeDriver` is not supported because the native animated module is missing. Falling back to JS-based animation.'
  ]
) {
  const originalWarn =
    globalThis.console && typeof globalThis.console.warn === 'function'
      ? globalThis.console.warn
      : function () {}

  if (!globalThis.console) return originalWarn

  globalThis.console.warn = function filteredConsoleWarn(msg) {
    try {
      if (typeof msg === 'string') {
        const shouldSuppress = suppressedWarnings.some(function (entry) {
          return msg.indexOf(entry) !== -1
        })
        if (shouldSuppress) return
      }
    } catch {
      // If filtering fails, forward to original warn.
    }

    return originalWarn.apply(this, arguments)
  }

  return originalWarn
}

installConsoleWarnFilter()
