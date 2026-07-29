import * as richJson from '@ambire-common/libs/richJson/richJson'
import { BOOT_MARK_PREFIX } from '@mobile/services/bootProfiler/constants'

import { encode } from './bridgeCodec'
import { workerBootProfiler } from './workerBootProfiler'

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void
    }
  }
}

// Dapp JSON-RPC traffic is JSON-safe, so it skips richJson (see bridgeCodec).
// Everything else (controller state, errors, one-time data, ...) keeps richJson.
const JSON_SAFE_EVENTS = new Set(['action.sendToDappWebView', 'action.broadcastDappEvent'])

// Controller state is the bulk of what crosses the bridge during boot, so the
// richJson stringify below and the resulting wire size are timed for the first
// emit of each controller. Only the first: later emits are not boot cost.
const profileCtrlUpdateEncode = (ctrlName: string, encodeState: () => string) => {
  const markName = `${BOOT_MARK_PREFIX.workerCtrlEncode}${ctrlName}`
  if (!workerBootProfiler.reserveOnce(markName)) return encodeState()

  workerBootProfiler.startSpan(markName)
  const message = encodeState()
  workerBootProfiler.endSpan(markName, { bytes: message.length })

  return message
}

const sendToReactEvent = (type: string, payload: any) => {
  try {
    if (window.ReactNativeWebView) {
      const encodeMessage = () => encode({ type, payload }, !JSON_SAFE_EVENTS.has(type))
      const ctrlName = type === 'ctrl.update' ? payload?.ctrlName : undefined

      window.ReactNativeWebView.postMessage(
        ctrlName ? profileCtrlUpdateEncode(ctrlName, encodeMessage) : encodeMessage()
      )
    }
  } catch (e) {
    // Fallback to original console if bridge fails

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
            const str = richJson.stringify(arg)
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
