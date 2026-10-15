import { EventEmitterRegistryController } from '@ambire-common/controllers/eventEmitterRegistry/eventEmitterRegistry'
import * as richJson from '@ambire-common/libs/richJson/richJson'
import { serializeControllerForUI } from '@common/utils/serializeControllerForUI'
import { BOOT_MARK, BOOT_MARK_PREFIX } from '@mobile/services/bootProfiler/constants'

import { decode, encode } from './bridgeCodec'
import { createBridgedFetch } from './bridgedFetch'
import { sendToReactEvent } from './webviewLogger'
import { flushWorkerBootProfile, workerBootProfiler } from './workerBootProfiler'

import type { SerializedStorageSnapshot } from '@common/services/storage/types'

// The worker hosts no controllers. The wallet's controllers run in the React
// Native realm (see @mobile/services/controllerHost), so this bundle is only the
// host they would need if a controller is ever moved back in here: the RN bridge,
// a bridged fetch and storage, and the registry wiring that streams controller
// state to the UI. `initControllers` below is where such a controller gets built.

// Everything this bundle pulls in has now been evaluated. The gap to
// `worker.bundle.evalStart` is the cost of the module graph alone, before a single
// controller is constructed.
workerBootProfiler.mark(BOOT_MARK.workerImportsEvaluated)

// Bridge setup
const pendingPromises: Record<number, { resolve: any; reject: any }> = {}
let messageIdCounter = 0

const ctrlOnUpdateIsDirtyFlags: Record<string, boolean> = {}

// Times the first state build per controller. Later emits are not boot cost and
// would grow the mark list forever.
function buildStateForFE(ctrlName: string, ctrl: any) {
  const markName = `${BOOT_MARK_PREFIX.workerCtrlSerialize}${ctrlName}`
  if (!workerBootProfiler.reserveOnce(markName)) return serializeControllerForUI(ctrl)

  return workerBootProfiler.measure(markName, () => serializeControllerForUI(ctrl))
}

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
      state: buildStateForFE(ctrlName, registeredCtrl),
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

// PERF: in-memory mirror of async storage, seeded once from the init snapshot RN
// takes of its MMKV instance. Holds the same RAW serialized strings RN's storage
// layer stores, so reads parse with richJson exactly as a bridged storage.get would
// have, and a controller's boot reads resolve locally instead of each making a
// separate injectJavaScript round-trip. Which keys travel in the snapshot is RN's
// call (see BOOT_SNAPSHOT_STORAGE_KEYS).
const storageCache: Record<string, string> = {}
let storageCacheSeeded = false
// Every key RN's storage holds, including the ones left out of the snapshot. What
// tells "not stored" apart from "stored but not snapshotted", which is the difference
// between returning the default value and going to the bridge for it.
const storedKeys = new Set<string>()

const seedStorageCache = (snapshot: SerializedStorageSnapshot | undefined) => {
  if (!snapshot) return
  Object.entries(snapshot.values).forEach(([key, serialized]) => {
    storageCache[key] = serialized
  })
  snapshot.allKeys.forEach((key) => storedKeys.add(key))
  storageCacheSeeded = true
}

// Records the first read of each storage key.
const markFirstStorageRead = (key: string) => {
  const markName = `${BOOT_MARK_PREFIX.workerStorageRead}${key}`
  if (workerBootProfiler.reserveOnce(markName)) workerBootProfiler.mark(markName)
}

/**
 * Storage for controllers running in this worker. RN's MMKV instance owns the data;
 * reads are served from the seeded cache where possible and fall back to a bridge
 * round-trip, writes always go through the bridge.
 */
const storageAPI = {
  get: (key: string, defaultValue?: any) => {
    markFirstStorageRead(key)

    // Serve from the seeded cache to avoid a bridge round-trip.
    if (storageCacheSeeded) {
      const serialized = storageCache[key]
      if (serialized !== undefined) return Promise.resolve(richJson.parse(serialized))

      // A key RN listed as stored but did not snapshot is fetched over the bridge on
      // this first read. A miss on both means the key genuinely isn't stored →
      // defaultValue, matching RN's storage.get semantics. Do NOT go to the bridge in
      // that case: many of the keys read at boot are absent from storage, and one
      // round-trip each is what the snapshot exists to get rid of.
      if (storedKeys.has(key)) return sendToRNAsync('storage.get', { key, defaultValue })

      return Promise.resolve(defaultValue)
    }
    // Cache not seeded yet (no snapshot for some reason) → fall back to bridge.
    return sendToRNAsync('storage.get', { key, defaultValue })
  },
  set: (key: string, value: any) => {
    // Keep the cache coherent with the write, then persist through the bridge.
    storageCache[key] = richJson.stringify(value)
    storedKeys.add(key)
    return sendToRNAsync('storage.set', { key, value })
  },
  remove: (key: string) => {
    delete storageCache[key]
    storedKeys.delete(key)
    return sendToRNAsync('storage.remove', { key })
  }
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

    // PERF: seed the storage cache BEFORE constructing controllers, so their
    // initial-load storage reads hit the in-memory cache instead of the bridge.
    workerBootProfiler.measure(
      BOOT_MARK.workerStorageCacheSeeded,
      () => seedStorageCache(config.__storageSnapshot),
      { count: Object.keys(config.__storageSnapshot?.values || {}).length }
    )

    // No controller is hosted here yet. Construct one against `eventEmitterRegistry`,
    // `storageAPI` and `bridgedFetch` and it streams to the UI through the wiring above.
    if (__DEV__) console.log('[WebView] Worker configured with', Object.keys(config).join(', '))

    // Notify RN that we are ready with ALL controller names
    const allControllerNames = eventEmitterRegistry.values().map((c) => c.name)
    workerBootProfiler.mark(BOOT_MARK.workerReady, { count: allControllerNames.length })
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
      // Recorded after the decode above, so the gap to `rn.initPayload.injected`
      // is the injectJavaScript hop plus the richJson parse of the storage snapshot.
      workerBootProfiler.mark(BOOT_MARK.workerInitReceived, {
        bytes: typeof event.data === 'string' ? event.data.length : undefined
      })
      initControllers(data.config)
    } else if (data.type === 'dispatchAction') {
      // Answered before the configured gate: a worker hosting nothing still has its
      // bundle eval and page timings to report.
      if (data.action?.type === 'FLUSH_BOOT_PROFILE') {
        flushWorkerBootProfile()
        return
      }

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
