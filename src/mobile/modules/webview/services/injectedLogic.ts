// MUST be first: installs a BigInt-safe structuredClone before any controller
// code runs. iOS 16's native structuredClone corrupts BigInt-containing
// portfolio state (see structuredCloneShim.ts), crashing the dashboard.
import { getStructuredCloneShimStatus } from './structuredCloneShim'

import { EventEmitter as Emitter } from 'events'

import { EventEmitterRegistryController } from '@ambire-common/controllers/eventEmitterRegistry/eventEmitterRegistry'
import { MainController } from '@ambire-common/controllers/main/main'
import { KeystoreSigner } from '@ambire-common/libs/keystoreSigner/keystoreSigner'
import * as richJson from '@ambire-common/libs/richJson/richJson'
// Import the `.native` implementations explicitly. The worker bundle is built
// by webpack with `.web.ts` resolved first, so the barrel imports would pull in
// the `.web.ts` versions — which depend on the Chrome extension `browser` API
// (`browser.alarms` for auto-lock, `browser.action` for the toolbar-pinned
// check). In the mobile worker `browser` is null, so auto-lock never arms and
// the pinned-check loops uselessly. The `.native` versions use a plain
// setTimeout and drop the browser-only logic, which is correct for mobile.
import { AutoLockController } from '@common/controllers/auto-lock/auto-lock.native'
import { WalletStateController } from '@common/controllers/wallet-state/wallet-state.native'
import { handleActions } from '@mobile/handlers/handleActions'

import {
  buildStateForFE,
  getBootPhase,
  isControllerSubscribed,
  isCriticalController,
  isSubscriptionGateActive,
  queueDeferredCtrlPayload,
  queueSuppressedCtrlPayload,
  setCriticalControllers
} from './bootPhase'
import { decode, encode } from './bridgeCodec'
import { createBridgedFetch } from './bridgedFetch'
import { sendToReactEvent } from './webviewLogger'

// Bridge setup
const pendingPromises: Record<number, { resolve: any; reject: any }> = {}
let messageIdCounter = 0

const ctrlOnUpdateIsDirtyFlags: Record<string, boolean> = {}

function debounceFrontEndEventUpdatesOnSameTick(
  ctrlName: string,
  ctrl: any,
  mainCtrl: any,
  forceEmit?: boolean
): 'DEBOUNCED' | 'EMITTED' {
  const sendUpdate = () => {
    // Paused dynamic controllers may finish async work after being replaced.
    // Re-resolve the live controller from the registry instead of using the
    // captured `ctrl` so a stale/removed instance never streams to the FE.
    const registeredCtrl = eventEmitterRegistry.values().find((c) => c.name === ctrlName)
    if (!registeredCtrl) return

    sendToReactEvent('ctrl.update', {
      ctrlName,
      state: buildStateForFE(ctrlName, registeredCtrl),
      forceEmit
    })
  }

  /**
   * Bypasses both background and React batching,
   * ensuring that the state update is immediately applied at the application level (React/Extension).
   * forceEmit also bypasses the boot-phase deferral — it is reserved for cases where
   * the UI is actively waiting on the update (status flags driven by user actions).
   */
  if (forceEmit) {
    sendUpdate()
    return 'EMITTED'
  }

  // During the critical boot phase, hold back updates for non-critical
  // controllers. We keep only the latest state so the eventual drain emits
  // one update per deferred controller, not the full history.
  if (getBootPhase() === 'critical' && !isCriticalController(ctrlName)) {
    queueDeferredCtrlPayload(ctrlName, ctrl, forceEmit)
    return 'DEBOUNCED'
  }

  // Suppress non-critical controllers that no screen is currently displaying.
  // The expensive toJSON + stringify + bridge + parse round trip only happens
  // for state the UI actually consumes. We keep the latest reference so the
  // moment a screen subscribes, the queued state is flushed (see
  // setSubscribedControllers) and the UI never renders stale data.
  if (
    isSubscriptionGateActive() &&
    !isCriticalController(ctrlName) &&
    !isControllerSubscribed(ctrlName)
  ) {
    queueSuppressedCtrlPayload(ctrlName, ctrl, forceEmit)
    return 'DEBOUNCED'
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
// routed through the RN bridge — not just the explicit fetch param
// passed to MainController.
const bridgedFetch = createBridgedFetch(sendToRNAsync)
// @ts-ignore — override the global fetch with our bridge
window.fetch = bridgedFetch

// PERF: in-memory mirror of async storage, seeded once from the init snapshot
// (RN dumps the whole MMKV instance at init). Holds the same RAW serialized
// strings RN's storage layer stores, so reads parse with richJson exactly as a
// bridged storage.get would have. Lets the ~79 controller-boot reads resolve
// locally instead of each making a separate injectJavaScript round-trip.
const storageCache: Record<string, string> = {}
let storageCacheSeeded = false

const seedStorageCache = (snapshot: Record<string, string> | undefined) => {
  if (!snapshot) return
  Object.entries(snapshot).forEach(([key, serialized]) => {
    storageCache[key] = serialized
  })
  storageCacheSeeded = true
}

// Proxied Storage API
const storageAPI = {
  get: (key: string, defaultValue?: any) => {
    // Serve from the seeded cache to avoid a bridge round-trip. A missing key in
    // a seeded cache means it genuinely isn't in storage → return defaultValue,
    // matching RN's storage.get semantics (no bridge hop needed).
    if (storageCacheSeeded) {
      const serialized = storageCache[key]
      const value = serialized !== undefined ? richJson.parse(serialized) : defaultValue
      return Promise.resolve(value)
    }
    // Cache not seeded yet (no snapshot for some reason) → fall back to bridge.
    return sendToRNAsync('storage.get', { key, defaultValue })
  },
  set: (key: string, value: any) => {
    // Keep the cache coherent with the write, then persist through the bridge.
    storageCache[key] = richJson.stringify(value)
    return sendToRNAsync('storage.set', { key, value })
  },
  remove: (key: string) => {
    delete storageCache[key]
    return sendToRNAsync('storage.remove', { key })
  }
}

const eventEmitterRegistry = new EventEmitterRegistryController(() => {
  eventEmitterRegistry.values().forEach((ctrl: any) => {
    const hasOnUpdateInitialized = ctrl.onUpdateIds.includes('webview')
    if (!hasOnUpdateInitialized) {
      ctrl.onUpdate((forceEmit: boolean) => {
        debounceFrontEndEventUpdatesOnSameTick(ctrl.name, ctrl, mainCtrl, forceEmit)
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
let mainCtrl: any = null
let walletStateCtrl: any = null
let autoLockCtrl: any = null
let nextWindowId = 1
let currentWindowId = 1

const initControllers = (config: any) => {
  try {
    // Logged here (not in structuredCloneShim) because that module loads before
    // console forwarding is wired up, so its logs never reach Metro.
    console.log(getStructuredCloneShimStatus())

    // PERF: seed the storage cache BEFORE constructing controllers, so their
    // initial-load storage reads hit the in-memory cache instead of the bridge.
    seedStorageCache(config.__storageSnapshot)
    if (Array.isArray(config.criticalControllers)) {
      setCriticalControllers(config.criticalControllers)
    }

    mainCtrl = new MainController({
      eventEmitterRegistry,
      storageAPI,
      appVersion: config.APP_VERSION,
      platform: config.platform,
      fetch: bridgedFetch,
      relayerUrl: config.RELAYER_URL,
      velcroUrl: config.VELCRO_URL,
      liFiApiKey: config.LIFI_EXPLORER_URL,
      bungeeApiKey: config.BUNGEE_API_KEY,
      squidIntegratorId: config.SQUID_INTEGRATOR_ID,
      uniswapApiKey: config.UNISWAP_API_KEY,
      featureFlags: {},
      keystoreSigners: {
        internal: KeystoreSigner
      },
      externalSignerControllers: {},
      uiManager: {
        window: {
          open: async () => {
            currentWindowId = nextWindowId++
            // Await animation completion before resolving (mirrors chrome.windows.create).
            await sendToRNAsync('ui.window.action', { type: 'open', winId: currentWindowId })
            return {
              id: currentWindowId,
              width: 0,
              height: 0,
              left: 0,
              top: 0,
              focused: true,
              createdFromWindowId: 0
            }
          },
          focus: async () => {
            // Await confirmation before resolving (mirrors chrome.windows.update).
            await sendToRNAsync('ui.window.action', { type: 'focus', winId: currentWindowId })
            return {
              id: currentWindowId,
              width: 0,
              height: 0,
              left: 0,
              top: 0,
              focused: true,
              createdFromWindowId: 0
            }
          },
          closePopupWithUrl: async () => {},
          remove: async (winId: any) => {
            if (winId === 'popup') {
              return
            }
            const targetWinId = typeof winId === 'number' ? winId : currentWindowId
            // Await close animation completion before resolving (mirrors chrome.windows.remove).
            await sendToRNAsync('ui.window.action', { type: 'remove', winId: targetWinId })
          },
          event: new Emitter()
        },
        notification: {
          create: async () => {}
        },
        message: {
          sendToastMessage: (text: string, options: any) =>
            sendToReactEvent('action.addToast', { text, options }),
          sendUiMessage: (params: any) => sendToReactEvent('action.receiveOneTimeData', params),
          sendNavigateMessage: (viewId: string, route: string, params: any) =>
            sendToReactEvent('action.navigate', { route, params })
        }
      }
    })

    walletStateCtrl = new WalletStateController({
      eventEmitterRegistry,
      onLogLevelUpdateCallback: () => Promise.resolve(),
      storage: storageAPI
    })

    autoLockCtrl = new AutoLockController(
      eventEmitterRegistry,
      () => mainCtrl.keystore.lock(),
      storageAPI
    )

    // Initialize UI view inside the WebView worker context natively
    mainCtrl.ui.addView({ id: 'default-mobile-app-view', type: 'mobile' })

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

// Proxy Listener
window.addEventListener('message', (event) => {
  try {
    const data = typeof event.data === 'string' ? decode(event.data) : event.data
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
      handleActions(data.action, { eventEmitterRegistry, mainCtrl, sendToReactEvent })
    }
  } catch (e) {
    console.error('WebView failed to parse message', e, event.data)
  }
})

if (window.ReactNativeWebView) {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'system.loaded' }))
}
