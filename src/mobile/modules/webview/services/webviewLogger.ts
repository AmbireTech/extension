import * as richJson from '@ambire-common/libs/richJson/richJson'

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void
    }
  }
}

const sendToReactEvent = (type: string, payload: any) => {
  try {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(richJson.stringify({ type, payload }))
    }
  } catch (e) {
    // Fallback to original console if bridge fails
    // eslint-disable-next-line no-console
    console.warn('[WebView] Bridge error:', e)
  }
}

// Global console override to forward logs to React Native
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console)
  }

  const formatLogMessage = (args: any[]) => {
    return args
      .map((arg) => {
        try {
          if (typeof arg === 'object' && arg !== null) {
            // Limited depth/size to avoid bridge congestion
            const str = JSON.stringify(arg)
            return str.length > 1000 ? `${str.substring(0, 1000)}... (truncated)` : str
          }
          return String(arg)
        } catch (e) {
          return `[Unserializable ${typeof arg}]`
        }
      })
      .join(' ')
  }

  console.log = (...args: any[]) => {
    originalConsole.log(...args)
    sendToReactEvent('ctrl.debug', { log: `[WebView LOG] ${formatLogMessage(args)}` })
  }

  console.warn = (...args: any[]) => {
    originalConsole.warn(...args)
    sendToReactEvent('ctrl.debug', { log: `[WebView WARN] ${formatLogMessage(args)}` })
  }

  console.error = (...args: any[]) => {
    originalConsole.error(...args)
    sendToReactEvent('ctrl.debug', { log: `[WebView ERROR] ${formatLogMessage(args)}` })
  }

  console.info = (...args: any[]) => {
    originalConsole.info(...args)
    sendToReactEvent('ctrl.debug', { log: `[WebView INFO] ${formatLogMessage(args)}` })
  }

  console.debug = (...args: any[]) => {
    originalConsole.debug(...args)
    sendToReactEvent('ctrl.debug', { log: `[WebView DEBUG] ${formatLogMessage(args)}` })
  }

  // Use the new console.log to confirm it's working and forward it
  console.log('[WebView] Console forwarding enabled')
}

export { sendToReactEvent }
