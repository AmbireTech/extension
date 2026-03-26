import { EventEmitterRegistryController } from '@ambire-common/controllers/eventEmitterRegistry/eventEmitterRegistry'
import { MainController } from '@ambire-common/controllers/main/main'
import { WalletStateController } from '@common/controllers/wallet-state'
import { KeystoreSigner } from '@ambire-common/libs/keystoreSigner/keystoreSigner'
import { handleActions } from '@mobile/handlers/handleActions'
import { EventEmitter as Emitter } from 'events'
import * as richJson from '@ambire-common/libs/richJson/richJson'

// Bridge setup
const pendingPromises: Record<number, { resolve: any; reject: any }> = {}
let messageIdCounter = 0

const sendToReactEvent = (type: string, payload: any) => {
  console.log(`[WebView] Sending event: ${type}`, payload)
  // @ts-ignore
  window.ReactNativeWebView.postMessage(richJson.stringify({ type, payload }))
}

const sendToRNAsync = (type: string, payload: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const id = ++messageIdCounter
    pendingPromises[id] = { resolve, reject }
    // @ts-ignore
    window.ReactNativeWebView.postMessage(richJson.stringify({ id, type, payload }))
  })
}

// Proxied Storage API
const storageAPI = {
  get: (key: string, defaultValue?: any) => sendToRNAsync('storage.get', { key, defaultValue }),
  set: (key: string, value: any) => sendToRNAsync('storage.set', { key, value }),
  remove: (key: string) => sendToRNAsync('storage.remove', { key })
}

// Global initialization
const eventEmitterRegistry = new EventEmitterRegistryController(() => {})

// We temporarily pause handling actions until config is fully loaded
let isConfigured = false
let mainCtrl: any = null
let walletStateCtrl: any = null

const initControllers = (config: any) => {
  console.log('[WebView] Initializing controllers with config', config)
  try {
  mainCtrl = new MainController({
    eventEmitterRegistry,
    storageAPI,
    appVersion: config.APP_VERSION,
    platform: config.platform,
    fetch: fetch, // standard fetch in webview
    relayerUrl: config.RELAYER_URL,
    velcroUrl: config.VELCRO_URL,
    liFiApiKey: config.LIFI_EXPLORER_URL,
    bungeeApiKey: config.BUNGEE_API_KEY,
    featureFlags: {},
    keystoreSigners: {
      internal: KeystoreSigner
    },
    externalSignerControllers: {},
    uiManager: {
      window: {
        open: async () => ({ id: 1, width: 0, height: 0, left: 0, top: 0, focused: true, createdFromWindowId: 0 }),
        focus: async () => ({ id: 1, width: 0, height: 0, left: 0, top: 0, focused: true, createdFromWindowId: 0 }),
        closePopupWithUrl: async () => {},
        remove: async () => {},
        event: new Emitter()
      },
      notification: {
        create: async () => {}
      },
      message: {
        sendToastMessage: (text: string, options: any) => sendToReactEvent('action.addToast', { text, options }),
        sendUiMessage: (params: any) => sendToReactEvent('action.receiveOneTimeData', params),
        sendNavigateMessage: () => {}
      }
    }
  })

  walletStateCtrl = new WalletStateController({
    eventEmitterRegistry,
    onLogLevelUpdateCallback: () => Promise.resolve()
  })

  const ctrls = [mainCtrl, walletStateCtrl]

  // Initialize UI view inside the WebView worker context natively
  mainCtrl.ui.addView({
    id: 'default-mobile-app-view',
    type: 'mobile'
  })

  // Subscribe to ALL controllers in the registry to sync state back to React Native
  eventEmitterRegistry.values().forEach((ctrl) => {
    ctrl.onUpdate(() => {
      sendToReactEvent('ctrl.update', { ctrlName: ctrl.name, state: ctrl.toJSON() })
    }, 'webview')

    ctrl.onError(() => {
      sendToReactEvent('ctrl.error', { ctrlName: ctrl.name, errors: ctrl.emittedErrors })
    }, 'webview')
  })

  // Notify RN that we are ready with ALL controller names
  console.log('[WebView] Controllers initialized, sending system.ready')
  const allControllerNames = eventEmitterRegistry.values().map((c) => c.name)
  sendToReactEvent('system.ready', { controllers: allControllerNames })
  isConfigured = true
} catch (e: any) {
  console.error('[WebView] initControllers failed', e)
  sendToReactEvent('ctrl.error', { ctrlName: 'Init', errors: [{ message: e.message, stack: e.stack }] })
}
}

// Proxy Listener
window.addEventListener('message', (event) => {
  console.log('[WebView] Received window message', event.data)
  try {
    const data = typeof event.data === 'string' ? richJson.parse(event.data) : event.data
    if (data.type === 'response') {
      const { id, result, error } = data
      if (error) pendingPromises[id]?.reject(new Error(error))
      else pendingPromises[id]?.resolve(result)
      delete pendingPromises[id]
    } else if (data.type === 'init') {
      initControllers(data.config)
    } else if (data.type === 'dispatchAction') {
      if (!isConfigured) {
        console.warn('[WebView] Received action before init')
        return
      }
      handleActions(data.action, { eventEmitterRegistry, mainCtrl })
    }
  } catch (e) {
    console.error('WebView failed to parse message', e, event.data)
  }
})

console.log('[WebView] injectedLogic loaded and listening')
window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'system.loaded' }))

