import { EventEmitterRegistryController } from '@ambire-common/controllers/eventEmitterRegistry/eventEmitterRegistry'
import { serializeControllerForUI } from '@common/utils/serializeControllerForUI'

import { decode, encode } from './bridgeCodec'
import { createBridgedFetch } from './bridgedFetch'
import { sendToReactEvent } from './webviewLogger'

// The worker hosts no controllers. The wallet's controllers run in the React
// Native realm (see @mobile/services/controllerHost), so this bundle is only the
// host they would need if a controller is ever moved back in here: the RN bridge,
// a bridged fetch and storage, and the registry wiring that streams controller
// state to the UI. `initControllers` below is where such a controller gets built.

// Bridge setup
const pendingPromises: Record<number, { resolve: any; reject: any }> = {}
let messageIdCounter = 0

const ctrlOnUpdateIsDirtyFlags: Record<string, boolean> = {}

function debounceFrontEndEventUpdatesOnSameTick(
  ctrlName: string,
  forceEmit?: boolean
): 'DEBOUNCED' | 'EMITTED' {
  const sendUpdate = () => {
    // Paused dynamic controllers may finish async work after being replaced.
    // Re-resolve the live controller from the registry instead of using the
    // captured one so a stale/removed instance never streams to the FE.
    const registeredCtrl = eventEmitterRegistry.values().find((c) => c.name === ctrlName)
    if (!registeredCtrl) return

    sendToReactEvent('ctrl.update', {
      ctrlName,
      state: serializeControllerForUI(registeredCtrl),
      forceEmit
    })
  }

  /**
   * Bypasses both worker and React batching, ensuring that the state update is
   * immediately applied at the application level.
   */
  if (forceEmit) {
    sendUpdate()
    return 'EMITTED'
  }

  if (ctrlOnUpdateIsDirtyFlags[ctrlName]) return 'DEBOUNCED'
  ctrlOnUpdateIsDirtyFlags[ctrlName] = true

  // Debounce multiple emits in the same tick and only execute one of them
  setTimeout(() => {
    if (ctrlOnUpdateIsDirtyFlags[ctrlName]) {
      // If the toJSON method of a controller ever throws, we want to catch it here
      // otherwise the ctrlOnUpdateIsDirtyFlags flag will remain true forever and no further updates
      // will be sent to the UI for that controller
      try {
        sendUpdate()
      } catch (err) {
        ;(err as any).controllerName = ctrlName
        console.error('Debug: Failed to send update to UI for ctrl', ctrlName, err)
        // Send error back to React Native
        sendToReactEvent('ctrl.error', {
          ctrlName,
          errors: [{ message: (err as any).message, stack: (err as any).stack }]
        })
      }
    }
    ctrlOnUpdateIsDirtyFlags[ctrlName] = false
  }, 0)

  return 'EMITTED'
}

const sendToRNAsync = (type: string, payload: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const id = ++messageIdCounter
    pendingPromises[id] = { resolve, reject }
    // network.fetch payloads are plain strings, so they skip richJson. storage/crypto
    // keep richJson (storage values may carry BigInt). See bridgeCodec.
    // @ts-ignore
    window.ReactNativeWebView.postMessage(encode({ id, type, payload }, type !== 'network.fetch'))
  })
}

// @ts-ignore
window.sendToRNAsync = sendToRNAsync

// Create the bridged fetch and override window.fetch globally.
// This ensures ALL network requests in the WebView (including ethers.js
// JSON-RPC providers and any other library using fetch directly) are
// routed through the RN bridge.
const bridgedFetch = createBridgedFetch(sendToRNAsync)
// @ts-ignore — override the global fetch with our bridge
window.fetch = bridgedFetch

/**
 * Storage for controllers running in this worker. Every read and write is a bridge
 * round-trip to RN's MMKV instance, which owns the data. Nothing is read at boot —
 * the worker only touches storage once a controller asks it to.
 */
const storageAPI = {
  get: (key: string, defaultValue?: any) => sendToRNAsync('storage.get', { key, defaultValue }),
  set: (key: string, value: any) => sendToRNAsync('storage.set', { key, value }),
  remove: (key: string) => sendToRNAsync('storage.remove', { key })
}

const eventEmitterRegistry = new EventEmitterRegistryController(() => {
  eventEmitterRegistry.values().forEach((ctrl: any) => {
    const hasOnUpdateInitialized = ctrl.onUpdateIds.includes('webview')
    if (!hasOnUpdateInitialized) {
      ctrl.onUpdate((forceEmit: boolean) => {
        debounceFrontEndEventUpdatesOnSameTick(ctrl.name, forceEmit)
      }, 'webview')
    }

    const hasOnErrorInitialized = ctrl.onErrorIds.includes('webview')
    if (!hasOnErrorInitialized) {
      ctrl.onError(() => {
        if (!ctrl.isInRegistry()) return

        sendToReactEvent('ctrl.error', { ctrlName: ctrl.name, errors: ctrl.emittedErrors })
      }, 'webview')
    }
  })
})

// We temporarily pause handling actions until config is fully loaded
let isConfigured = false

const initControllers = (config: any) => {
  try {
    // Logged here (not in structuredCloneShim) because that module loads before
    // console forwarding is wired up, so its logs never reach Metro.
    console.log((globalThis as any).__structuredCloneShimStatus)

    // No controller is hosted here yet. Construct one against `eventEmitterRegistry`,
    // `storageAPI` and `bridgedFetch` and it streams to the UI through the wiring above.
    if (__DEV__) console.log('[WebView] Worker configured with', Object.keys(config).join(', '))

    // Notify RN that we are ready with ALL controller names
    const allControllerNames = eventEmitterRegistry.values().map((c) => c.name)
    sendToReactEvent('system.ready', { controllers: allControllerNames })
    isConfigured = true
  } catch (e: any) {
    sendToReactEvent('ctrl.error', {
      ctrlName: 'Init',
      errors: [{ message: e.message, stack: e.stack }]
    })
  }
}

// Calls a method on a controller hosted here. Only `method` actions can be served
// by the worker on its own — every other action type is MainController-specific
// and is handled in the RN realm (see @mobile/handlers/handleActions).
const handleWorkerAction = (action: any) => {
  if (action?.type !== 'method') {
    console.warn(`[WebView] Action ${action?.type} is not handled by the worker`)
    return
  }

  const { ctrlName, method, args } = action.params
  const ctrl = eventEmitterRegistry.values().find((c) => c.name === ctrlName) as any

  if (!ctrl) {
    console.error(`[WebView] Controller ${ctrlName} not found`)
    return
  }

  if (typeof ctrl[method] === 'function') ctrl[method](...args)
}

// Proxy Listener
window.addEventListener('message', (event) => {
  let data: any
  try {
    data = typeof event.data === 'string' ? decode(event.data) : event.data
  } catch (e) {
    // NEVER log the raw message nor the parse error itself in production.
    // Dispatched actions could carry secrets (keystore password, extra entropy) and V8
    // quotes a slice of the offending input inside its JSON.parse error message,
    // so both would leak them into logcat. DefinePlugin inlines __DEV__ (see
    // webpack.webview.config.js), so this branch is stripped from prod bundles.
    if (__DEV__) console.error('WebView failed to decode message', e, event.data)
    else console.error('WebView failed to decode an incoming message')
    return
  }

  try {
    if (data.type === 'response') {
      const { id, result, error } = data
      if (error) pendingPromises[id]?.reject(new Error(error))
      else pendingPromises[id]?.resolve(result)
      delete pendingPromises[id]
    } else if (data.type === 'init') {
      initControllers(data.config)
    } else if (data.type === 'dispatchAction') {
      if (!isConfigured) {
        return
      }
      handleWorkerAction(data.action)
    }
  } catch (e) {
    console.error('WebView failed to handle message', data?.type, e)
  }
})

if (window.ReactNativeWebView) {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'system.loaded' }))
}

// What a controller hosted here is built against: the registry that streams its
// state to the UI, storage and fetch that reach RN over the bridge.
export { bridgedFetch, eventEmitterRegistry, storageAPI }
