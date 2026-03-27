import { EventEmitter as Emitter } from 'events'

import { EventEmitterRegistryController } from '@ambire-common/controllers/eventEmitterRegistry/eventEmitterRegistry'
import { MainController } from '@ambire-common/controllers/main/main'
import { KeystoreSigner } from '@ambire-common/libs/keystoreSigner/keystoreSigner'
import * as richJson from '@ambire-common/libs/richJson/richJson'
import { WalletStateController } from '@common/controllers/wallet-state'
import { handleActions } from '@mobile/handlers/handleActions'

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

// @ts-ignore
window.sendToRNAsync = sendToRNAsync

// Proxied Storage API
const storageAPI = {
  get: (key: string, defaultValue?: any) => sendToRNAsync('storage.get', { key, defaultValue }),
  set: (key: string, value: any) => sendToRNAsync('storage.set', { key, value }),
  remove: (key: string) => sendToRNAsync('storage.remove', { key })
}

const eventEmitterRegistry = new EventEmitterRegistryController(() => {
  console.log('values', eventEmitterRegistry.values())
  eventEmitterRegistry.values().forEach((ctrl: any) => {
    const hasOnUpdateInitialized = ctrl.onUpdateIds.includes('webview')
    if (!hasOnUpdateInitialized) {
      console.log(`[WebView] Attaching onUpdate bridge listener to: ${ctrl.name}`)
      ctrl.onUpdate(() => {
        sendToReactEvent('ctrl.update', { ctrlName: ctrl.name, state: ctrl.toJSON() })
      }, 'webview')
    }

    const hasOnErrorInitialized = ctrl.onErrorIds.includes('webview')
    if (!hasOnErrorInitialized) {
      console.log(`[WebView] Attaching onError bridge listener to: ${ctrl.name}`)
      ctrl.onError(() => {
        sendToReactEvent('ctrl.error', { ctrlName: ctrl.name, errors: ctrl.emittedErrors })
      }, 'webview')
    }
  })
})

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
      fetch: fetch.bind(window),
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
          open: async () => ({
            id: 1,
            width: 0,
            height: 0,
            left: 0,
            top: 0,
            focused: true,
            createdFromWindowId: 0
          }),
          focus: async () => ({
            id: 1,
            width: 0,
            height: 0,
            left: 0,
            top: 0,
            focused: true,
            createdFromWindowId: 0
          }),
          closePopupWithUrl: async () => {},
          remove: async () => {},
          event: new Emitter()
        },
        notification: {
          create: async () => {}
        },
        message: {
          sendToastMessage: (text: string, options: any) =>
            sendToReactEvent('action.addToast', { text, options }),
          sendUiMessage: (params: any) => sendToReactEvent('action.receiveOneTimeData', params),
          sendNavigateMessage: () => {}
        }
      }
    })

    walletStateCtrl = new WalletStateController({
      eventEmitterRegistry,
      onLogLevelUpdateCallback: () => Promise.resolve()
    })

    // Initialize UI view inside the WebView worker context natively
    mainCtrl.ui.addView({ id: 'default-mobile-app-view', type: 'mobile' })

    // Notify RN that we are ready with ALL controller names
    const allControllerNames = eventEmitterRegistry.values().map((c) => c.name)
    sendToReactEvent('system.ready', { controllers: allControllerNames })
    isConfigured = true
  } catch (e: any) {
    console.error('[WebView] initControllers failed', e)
    sendToReactEvent('ctrl.error', {
      ctrlName: 'Init',
      errors: [{ message: e.message, stack: e.stack }]
    })
  }
}

// Proxy Listener
window.addEventListener('message', (event) => {
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
      handleActions(data.action, { eventEmitterRegistry, mainCtrl, sendToReactEvent })
    }
  } catch (e) {
    console.error('WebView failed to parse message', e, event.data)
  }
})

// Direct bridge for reliable communication
// @ts-ignore
window.__POST_MESSAGE__ = (dataStr: string) => {
  console.log('[WebView] __POST_MESSAGE__ received data length:', dataStr.length)
  try {
    const data = richJson.parse(dataStr)
    console.log('[WebView] __POST_MESSAGE__ parsed type:', data.type)
    if (data.type === 'dispatchAction') {
      if (!isConfigured) {
        console.warn('[WebView] __POST_MESSAGE__ rejected: NOT CONFIGURED')
        return
      }
      handleActions(data.action, { eventEmitterRegistry, mainCtrl, sendToReactEvent })
    } else if (data.type === 'init') {
      initControllers(data.config)
    } else if (data.type === 'response') {
      const { id, result, error } = data
      if (error) pendingPromises[id]?.reject(new Error(error))
      else pendingPromises[id]?.resolve(result)
      delete pendingPromises[id]
    }
  } catch (e: any) {
    console.error('[WebView] __POST_MESSAGE__ failed', e)
    sendToReactEvent('ctrl.error', {
      ctrlName: 'BridgeError',
      errors: [{ message: e.message, stack: e.stack }]
    })
  }
}

console.log('[WebView] injectedLogic loaded and listening')
window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'system.loaded' }))
