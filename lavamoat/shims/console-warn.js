function installConsoleWarnFilter(
  suppressedWarnings = [
    'No routes matched location',
    'setNativeProps is deprecated. Please update props using React state instead.',
    'Animated: `useNativeDriver` is not supported because the native animated module is missing. Falling back to JS-based animation.',
    // LavaMoat wraps modules in `with(scopeProxy){}`, but dynamic import() loads chunks as ES modules (always strict mode),
    // and strict mode forbids `with` - causing a SyntaxError on parse:
    //   "Dynamic import loader failed. Using fallback loader [...] SyntaxError: Strict mode code may not include a with statement"
    // The fallback loader (WTW_INJECT) recovers by injecting the chunk via importScripts instead.
    // Security is intact: the chunk is still LavaMoat-wrapped, so all global access remains policy-enforced.
    'Dynamic import loader failed. Using fallback loader'
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
