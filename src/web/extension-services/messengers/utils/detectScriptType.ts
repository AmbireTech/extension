export function detectScriptType(): 'background' | 'contentScript' | 'popup' | 'inpage' {
  const hasChromeRuntime = typeof chrome !== 'undefined' && chrome.runtime
  const hasWindow = typeof window !== 'undefined'

  // Background scripts don't have `window`
  if (hasChromeRuntime && !hasWindow) return 'background'

  if (hasWindow) {
    // If this is a real extension context, chrome.runtime.id should be defined
    const isRealExtensionContext = hasChromeRuntime && chrome.runtime?.id

    const pathname = window?.location?.pathname || ''
    const protocol = window?.location?.protocol || ''
    // Pathname heuristics must only run on extension-owned documents. Content scripts
    // execute in the *page* origin (e.g. https://connect.trezor.io/.../popup.html), and
    // many third-party flows use paths containing "popup" — misdetecting breaks messengers.
    const isExtensionDocument =
      protocol === 'chrome-extension:' ||
      protocol === 'moz-extension:' ||
      protocol === 'safari-web-extension:'

    if (isExtensionDocument) {
      if (pathname.includes('background')) return 'background'
      if (pathname.includes('popup')) return 'popup'
      if (pathname.includes('contentscript')) return 'contentScript'
    }

    // If it's not a real extension context, fallback to inpage
    if (!isRealExtensionContext) return 'inpage'

    // If we still can't tell but it has chrome.runtime.id, it's probably a content script
    return 'contentScript'
  }

  throw new Error('Undetected script.')
}
