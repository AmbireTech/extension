import { EventEmitter as Emitter } from 'events'
import { nanoid } from 'nanoid'
/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { EventEmitterRegistryController } from '@ambire-common/controllers/eventEmitterRegistry/eventEmitterRegistry'
import { MainController } from '@ambire-common/controllers/main/main'
import { ErrorRef } from '@ambire-common/interfaces/eventEmitter'
import { IKeystoreController } from '@ambire-common/interfaces/keystore'
import { WindowProps } from '@ambire-common/interfaces/ui'
import { KeystoreSigner } from '@ambire-common/libs/keystoreSigner/keystoreSigner'
import { captureMessage } from '@common/config/analytics/CrashAnalytics.web'
import { APP_VERSION } from '@common/config/env'
import { ToastOptions } from '@common/contexts/toastContext'
import useIsScreenFocused from '@common/hooks/useIsScreenFocused'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useToast from '@common/hooks/useToast'
import { BUNGEE_API_KEY, LI_FI_API_KEY, RELAYER_URL, VELCRO_URL } from '@env'
import { isExtension } from '@web/constants/browserapi'
import {
  controllersMiddlewareContextDefaults,
  ControllersMiddlewareContextReturnType
} from '@web/contexts/controllersMiddlewareContext/types'
import { Action } from '@web/extension-services/background/actions'
import { WalletStateController } from '@web/extension-services/background/controllers/wallet-state'
import { handleActions } from '@web/extension-services/background/handlers/handleActions'
import storage from '@web/extension-services/background/webapi/storage'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import eventBus from '@web/extension-services/event/eventBus'
import { PortMessenger } from '@web/extension-services/messengers'
import { getUiType } from '@web/utils/uiType'

let globalDispatch: ControllersMiddlewareContextReturnType['dispatch']
let pm: PortMessenger
const actionsBeforeBackgroundReady: Action[] = []
let backgroundReady: boolean
let connectPort: () => Promise<void> = () => Promise.resolve()
const MAX_RETRIES = 20
// Facilitate communication between the different parts of the browser extension.
// Utilizes the PortMessenger class to establish a connection between the popup
// and background pages, and the eventBus to emit and listen for events.
// This allows the browser extension's UI to send and receive messages to and
// from the background process (needed for updating the browser extension UI
// based on the state of the background process and for sending dApps-initiated
// actions to the background for further processing.
if (isExtension) {
  const portId = nanoid()
  let retries = 0
  connectPort = async () => {
    pm = new PortMessenger()
    backgroundReady = false

    let portName = 'popup'
    if (getUiType().isTab) portName = 'tab'
    if (getUiType().isRequestWindow) portName = 'request-window'

    pm.connect({ id: portId, name: portName })
    // connect to the portMessenger initialized in the background
    // @ts-ignore
    pm.addConnectListener(pm.ports[0].id, (messageType, { method, params, forceEmit }) => {
      if (method === 'portReady') {
        backgroundReady = true
        actionsBeforeBackgroundReady.forEach((a) => globalDispatch(a))
        actionsBeforeBackgroundReady.length = 0
        return
      }
      if (messageType === '> ui') {
        if (method === 'closePopup' && getUiType().isPopup) {
          closeCurrentWindow()
        } else {
          eventBus.emit(method, params, forceEmit)
        }
      }
      if (messageType === '> ui-error') {
        eventBus.emit('error', params)
      }
      if (messageType === '> ui-toast') {
        eventBus.emit(method, params)
      }
    })

    // Use at least 1000ms; on slower PCs, background responses can be slightly delayed,
    // causing multiple recursive connectPort calls and slowing down window initialization.
    // Once MAX_RETRIES is reached, it will stop retrying and wait indefinitely for the background to send 'portReady'
    // because if the 'portReady' res from the background is delayed more than 1000ms the connection will never resolve calling the recursion forever
    setTimeout(() => {
      if (!backgroundReady && retries === MAX_RETRIES) {
        captureMessage(
          `Error: Failed to connect with the service worker after maximum retries. Window type: ${portName}`,
          { level: 'fatal' }
        )
      }

      if (!backgroundReady && retries < MAX_RETRIES) {
        console.log({ retries })
        retries++
        connectPort()
      }
    }, 1000)
  }

  connectPort()
}

if (isExtension) {
  const ACTIONS_TO_DISPATCH_EVEN_WHEN_HIDDEN = [
    'INIT_CONTROLLER_STATE',
    'MAIN_CONTROLLER_ACTIVITY_SET_ACC_OPS_FILTERS',
    'MAIN_CONTROLLER_ACTIVITY_RESET_ACC_OPS_FILTERS'
  ]

  globalDispatch = (action, windowId?: number) => {
    // Dispatch the action only when the tab or popup is focused or active.
    // Otherwise, multiple dispatches could occur if the same screen is open in multiple tabs/popup windows,
    // causing unpredictable background/controllers state behavior.
    // dispatches from request-window should not be blocked even when unfocused
    // because we can have only one instance of request-window and only one instance for the given action screen
    // (an action screen could not be opened in tab or popup window by design)
    const shouldBlockDispatch = document.hidden && !getUiType().isRequestWindow
    if (shouldBlockDispatch && !ACTIONS_TO_DISPATCH_EVEN_WHEN_HIDDEN.includes(action.type)) return

    if (!backgroundReady) {
      actionsBeforeBackgroundReady.push(action)
    } else {
      pm.send('> background', action, { windowId })
    }
  }
}

const ControllersMiddlewareContext = createContext<ControllersMiddlewareContextReturnType>(
  controllersMiddlewareContextDefaults
)

const ExtensionControllersMiddlewareProvider: React.FC<any> = ({ children }) => {
  const { addToast } = useToast()
  const route = useRoute()
  const timer: any = useRef(null)
  const isFocused = useIsScreenFocused()
  const { navigate } = useNavigation()
  const [windowId, setWindowId] = useState<number | undefined>()
  const hasConnectedToTheBackground = useRef(false)

  useEffect(() => {
    if (!isExtension) return
    ;(async () => {
      if (getUiType().isPopup) {
        const win = await chrome.windows.getCurrent()
        setWindowId(win.id)
      } else if (getUiType().isTab) {
        const tab = await chrome.tabs.getCurrent()
        if (tab) setWindowId(tab.windowId)
      }
    })()
  }, [])

  useEffect(() => {
    const { pathname = '/', search = '', hash = '' } = route

    const url = `${window.location.origin}${pathname}${search}${hash}`

    const searchParams = new URLSearchParams(search)
    const searchParamsFormatted = Object.fromEntries(searchParams.entries())

    globalDispatch({
      type: 'UPDATE_PORT_URL',
      params: {
        url,
        route: pathname.startsWith('/') ? pathname.slice(1) : pathname,
        searchParams: searchParamsFormatted
      }
    })
  }, [route])

  useEffect(() => {
    if (!isExtension) return

    const keepAlive = async () => {
      try {
        const res = await chrome.runtime.sendMessage('ambire-extension-ping')
        if (res === 'ambire-extension-pong') hasConnectedToTheBackground.current = true
      } catch (error) {
        console.error(error)
      }
      timer.current = setTimeout(keepAlive, 2000)
    }

    if (isFocused) {
      keepAlive()
    } else if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [isFocused])

  useEffect(() => {
    if (!isExtension) return

    try {
      chrome.runtime.onMessage.addListener(async (message: any) => {
        if (!hasConnectedToTheBackground.current) return

        if (message.action === 'sw-started') {
          // if the sw restarts and the current window is an action window then close it
          // because the actions state has been lost after the sw restart
          if (getUiType().isRequestWindow) {
            closeCurrentWindow()
          } else {
            sessionStorage.setItem('backgroundState', 'restarted')
            window.location.reload()
          }
        }
      })
    } catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {
    if (!isExtension) return

    const backgroundState = sessionStorage.getItem('backgroundState')

    if (backgroundState === 'restarted') {
      addToast(
        'Page was restarted because the browser put Ambire to sleep. Any transactions or operations you have started have been cleared.',
        { type: 'info', sticky: true }
      )
      sessionStorage.removeItem('backgroundState')
    }
  }, [addToast])

  useEffect(() => {
    const onError = (newState: { errors: ErrorRef[]; controller: string }) => {
      const lastError = newState.errors[newState.errors.length - 1]
      if (lastError) {
        if (lastError.level !== 'silent')
          // Most of the errors incoming are descriptive and tend to be long,
          // so keep a longer timeout to give the user enough time to read them.
          addToast(lastError.message, { timeout: 12000, type: 'error' })

        console.error(
          `Error in ${newState.controller} controller. Inspect background page to see the full stack trace.`
        )
      }
    }

    eventBus.addEventListener('error', onError)

    return () => eventBus.removeEventListener('error', onError)
  }, [addToast])

  useEffect(() => {
    const onAddToast = ({ text, options }: { text: string; options: ToastOptions }) =>
      addToast(text, options)

    eventBus.addEventListener('addToast', onAddToast)

    return () => eventBus.removeEventListener('addToast', onAddToast)
  }, [addToast])

  useEffect(() => {
    const onNavigate = ({ route: navRoute }: { route: string }) => navigate(navRoute)

    eventBus.addEventListener('navigate', onNavigate)

    return () => eventBus.removeEventListener('navigate', onNavigate)
  }, [addToast, navigate])

  const dispatch = useCallback(
    (action: Action) => {
      globalDispatch(action, windowId)
    },
    [windowId]
  )

  return (
    <ControllersMiddlewareContext.Provider
      value={useMemo(() => ({ dispatch, windowId }), [dispatch, windowId])}
    >
      {children}
    </ControllersMiddlewareContext.Provider>
  )
}

const CommonControllersMiddlewareProvider: React.FC<any> = ({ children }) => {
  const { addToast } = useToast()
  const { navigate } = useNavigation()
  const [isUnlocked, setIsUnlocked] = useState(false)
  const ctrlOnUpdateIsDirtyFlags = useRef<Record<string, boolean>>({})

  const debounceFrontEndEventUpdatesOnSameTick = useCallback(
    (ctrlName: string, ctrl: EventEmitter, forceEmit?: boolean): 'DEBOUNCED' | 'EMITTED' => {
      const sendUpdate = () => {
        eventBus.emit(ctrlName, ctrl.toJSON(), forceEmit)
      }

      /**
       * Bypasses both background and React batching,
       * ensuring that the state update is immediately applied at the application level (React/Extension).
       *
       * For more info, please refer to:
       * EventEmitter.forceEmitUpdate() or useControllerState().
       */
      if (forceEmit) {
        sendUpdate()
        return 'EMITTED'
      }

      if (ctrlOnUpdateIsDirtyFlags.current[ctrlName]) return 'DEBOUNCED'
      ctrlOnUpdateIsDirtyFlags.current[ctrlName] = true

      // Debounce multiple emits in the same tick and only execute one of them
      setTimeout(() => {
        if (ctrlOnUpdateIsDirtyFlags.current[ctrlName]) {
          // If the toJSON method of a controller ever throws, we want to catch it here
          // otherwise the ctrlOnUpdateIsDirtyFlags flag will remain true forever and no further updates
          // will be sent to the UI for that controller
          try {
            sendUpdate()
          } catch (err) {
            ;(err as any).controllerName = ctrlName
            console.error('Debug: Failed to send update to UI for ctrl', ctrlName, err)
            // TODO: sentry
            // captureBackgroundException(err)
          }
        }
        ctrlOnUpdateIsDirtyFlags.current[ctrlName] = false
      }, 0)

      return 'EMITTED'
    },
    []
  )

  const eventEmitterRegistry = useRef<EventEmitterRegistryController>(
    new EventEmitterRegistryController(() => {
      eventEmitterRegistry.current.values().forEach((ctrl) => {
        const hasOnUpdateInitialized = ctrl.onUpdateIds.includes('background')
        if (!hasOnUpdateInitialized) {
          ctrl.onUpdate(async (forceEmit) => {
            const res = debounceFrontEndEventUpdatesOnSameTick(ctrl.name, ctrl, forceEmit)
            if (res === 'DEBOUNCED') return

            if (ctrl.name === 'KeystoreController') {
              const keystoreCtrl = ctrl as IKeystoreController
              if (keystoreCtrl.isReadyToStoreKeys) {
                // TODO: sentry
                // setBackgroundUserContext({
                //   id: getExtensionInstanceId(keystoreCtrl.keyStoreUid, mainCtrl.invite.verifiedCode)
                // })
                if (isUnlocked && !keystoreCtrl.isUnlocked) {
                  await mainCtrl.current.dapps.broadcastDappSessionEvent('lock')
                }
                setIsUnlocked(keystoreCtrl.isUnlocked)
              }
            }

            if (ctrl.name === 'SelectedAccountController') {
              // TODO: sentry
              // const selectedAccountCtrl = ctrl as ISelectedAccountController
              // if (selectedAccountCtrl?.account?.addr) {
              //   setBackgroundExtraContext('account', selectedAccountCtrl.account.addr)
              // }
            }
          }, 'background')
        }
      })

      //
      // Add onError listeners
      //

      eventEmitterRegistry.current.values().forEach((ctrl) => {
        const hasOnErrorInitialized = ctrl.onErrorIds.includes('background')

        if (!hasOnErrorInitialized) {
          ctrl.onError((error) => {
            // stateDebug(walletStateCtrl.logLevel, ctrl, ctrl.name, 'error')
            eventBus.emit('error', {
              errors: ctrl.emittedErrors,
              controller: mainCtrl.current.name
            })
            // TODO: sentry
            // captureBackgroundExceptionFromControllerError(error, ctrl.name)
          }, 'background')
        }
      })
    })
  )

  // Skip adding custom headers and URL modifications for 3rd party URLs
  // (only internal Ambire APIs need the x-app-* headers and tracking params)
  // @ts-ignore
  const fetchWithAnalytics: Fetch = useCallback((url, init) => {
    const urlString = url.toString()
    try {
      const urlObj = new URL(urlString)
      if (!urlObj.hostname.endsWith('.ambire.com') && urlObj.hostname !== 'ambire.com') {
        // @ts-ignore
        return fetch(url, init)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      // If URL parsing fails, skip analytics for safety
      // @ts-ignore
      return fetch(url, init)
    }

    // As of v4.26.0, custom extension-specific headers. TBD for the other apps.
    const initWithCustomHeaders = init || { headers: { 'x-app-source': '', 'x-app-version': '' } }
    initWithCustomHeaders.headers = initWithCustomHeaders.headers || {}

    // if the fetch method is called while the keystore is constructing the keyStoreUid won't be defined yet
    // in that case we can still fetch but without our custom header
    // if (mainCtrl?.keystore?.keyStoreUid) {
    //   const instanceId = getExtensionInstanceId(
    //     mainCtrl.keystore.keyStoreUid,
    //     mainCtrl.invite?.verifiedCode || ''
    //   )

    //   initWithCustomHeaders.headers['x-app-source'] = instanceId
    //   const versionHeader = `extension-${APP_VERSION}-${process.env.WEB_ENGINE}`
    //   initWithCustomHeaders.headers['x-app-version'] = versionHeader
    // }

    // we want to calculate the TVL of our users
    // we can achieve this by making a relayer (server-side trusted environment) script that gets the balances of all our users
    // but doing this with all our users would be 'expensive'.
    // we already calculate the user balance in the extension, but is not 100% trusted as any user can modify it
    // that why we will use the user balance from the extension as a 'hint' so we can determine
    // on which accounts we should execute the 'expensive' script on the backend
    // those addresses should be 1) loaded with key in the extension 2) have more than $0 balance
    // const currentAccount = mainCtrl.selectedAccount.account
    // const hasCurrentAccountKeys =
    //   currentAccount &&
    //   getAccountKeysCount({
    //     accountAddr: currentAccount.addr,
    //     keys: mainCtrl.keystore.keys,
    //     accounts: mainCtrl.accounts.accounts
    //   })
    // // we use any cena request, because if we narrow it down to one route we might not have the full balance loaded
    // // on the relayer side we will simply use middleware that captures all routes and looks for the specific params with balance
    // // we want to attach the data only if the user has keys for the account
    // const currentBalance = mainCtrl.selectedAccount.portfolio.totalBalance
    // if (
    //   currentAccount &&
    //   (backgroundState.userBalances[currentAccount?.addr] || 0) < currentBalance
    // )
    //   backgroundState.userBalances[currentAccount?.addr] = currentBalance

    // const shouldAttachBalance =
    //   url.toString().startsWith('https://cena.ambire.com/') && hasCurrentAccountKeys
    // if (shouldAttachBalance) {
    //   const urlObj = new URL(url.toString())
    //   const balance = backgroundState.userBalances[currentAccount?.addr] || 0

    //   urlObj.searchParams.append('panVal', JSON.stringify({ a: currentAccount.addr, b: balance }))

    //   // eslint-disable-next-line no-param-reassign
    //   url = decodeURIComponent(urlObj.toString())
    // }

    // Use the native fetch (instead of node-fetch or whatever else) since
    // browser extensions are designed to run within the web environment,
    // which already provides a native and well-optimized fetch API.
    // @ts-ignore
    return fetch(url, initWithCustomHeaders)
  }, [])

  const mainCtrl = useRef<MainController>(
    new MainController({
      eventEmitterRegistry: eventEmitterRegistry.current,
      appVersion: APP_VERSION,
      platform: 'default',
      storageAPI: storage,
      fetch: fetchWithAnalytics,
      relayerUrl: RELAYER_URL,
      velcroUrl: VELCRO_URL,
      liFiApiKey: LI_FI_API_KEY,
      bungeeApiKey: BUNGEE_API_KEY,
      featureFlags: {},
      keystoreSigners: {
        internal: KeystoreSigner
      } as any,
      externalSignerControllers: {},
      uiManager: {
        window: {
          open: async () => {
            return {
              id: 1,
              width: 0,
              height: 0,
              left: 0,
              top: 0,
              focused: true,
              createdFromWindowId: 0
            } as WindowProps
          },
          focus: async () => {
            return {
              id: 1,
              width: 0,
              height: 0,
              left: 0,
              top: 0,
              focused: true,
              createdFromWindowId: 0
            } as WindowProps
          },
          closePopupWithUrl: async () => {},
          remove: async () => {},
          event: new Emitter()
        },
        notification: {
          create: async () => {}
        },
        message: {
          sendToastMessage: (text, options) => {
            eventBus.emit('addToast', { text, options })
          },
          sendUiMessage: (params) => {
            eventBus.emit('receiveOneTimeData', params)
          },
          sendNavigateMessage: () => {
            // TODO:
            // pm.send('> ui-navigate', ...)
          }
        }
      }
    })
  )

  const walletStateCtrl = useRef<WalletStateController>(
    new WalletStateController({
      eventEmitterRegistry: eventEmitterRegistry.current,
      onLogLevelUpdateCallback: async () => {}
    })
  )

  useEffect(() => {
    const onError = (newState: { errors: ErrorRef[]; controller: string }) => {
      const lastError = newState.errors[newState.errors.length - 1]
      if (lastError) {
        if (lastError.level !== 'silent')
          // Most of the errors incoming are descriptive and tend to be long,
          // so keep a longer timeout to give the user enough time to read them.
          addToast(lastError.message, { timeout: 12000, type: 'error' })

        console.error(
          `Error in ${newState.controller} controller. Inspect background page to see the full stack trace.`
        )
      }
    }

    eventBus.addEventListener('error', onError)

    return () => eventBus.removeEventListener('error', onError)
  }, [addToast])

  useEffect(() => {
    const onAddToast = ({ text, options }: { text: string; options: ToastOptions }) =>
      addToast(text, options)

    eventBus.addEventListener('addToast', onAddToast)

    return () => eventBus.removeEventListener('addToast', onAddToast)
  }, [addToast])

  useEffect(() => {
    const onNavigate = ({ route: navRoute }: { route: string }) => navigate(navRoute)

    eventBus.addEventListener('navigate', onNavigate)

    return () => eventBus.removeEventListener('navigate', onNavigate)
  }, [addToast, navigate])

  const dispatch = useCallback((action: Action) => {
    if (action.type === 'INIT_CONTROLLER_STATE') {
      const ctrl = eventEmitterRegistry.current
        .values()
        .find((c) => c.name === action.params.controller)
      if (ctrl) pm.send('> ui', { method: action.params.controller, params: ctrl })
    } else {
      handleActions(action, {
        eventEmitterRegistry: eventEmitterRegistry.current,
        mainCtrl: mainCtrl.current,
        walletStateCtrl: walletStateCtrl.current
      })
    }
  }, [])

  return (
    <ControllersMiddlewareContext.Provider value={useMemo(() => ({ dispatch }), [dispatch])}>
      {children}
    </ControllersMiddlewareContext.Provider>
  )
}

const ControllersMiddlewareProvider: React.FC<React.PropsWithChildren> = (props) => {
  return isExtension ? (
    <ExtensionControllersMiddlewareProvider {...props} />
  ) : (
    <CommonControllersMiddlewareProvider {...props} />
  )
}

export { ControllersMiddlewareProvider, ControllersMiddlewareContext }
