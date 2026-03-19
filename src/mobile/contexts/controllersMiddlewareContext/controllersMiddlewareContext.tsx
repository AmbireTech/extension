import { EventEmitter as Emitter } from 'events'
/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Platform as RNPlatform } from 'react-native'

import { EventEmitterRegistryController } from '@ambire-common/controllers/eventEmitterRegistry/eventEmitterRegistry'
import { MainController } from '@ambire-common/controllers/main/main'
import { IKeystoreController } from '@ambire-common/interfaces/keystore'
import { WindowProps } from '@ambire-common/interfaces/ui'
import { KeystoreSigner } from '@ambire-common/libs/keystoreSigner/keystoreSigner'
import { LIFI_EXPLORER_URL } from '@ambire-common/services/lifi/consts'
import { APP_VERSION } from '@common/config/env'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import { getInitialRoute } from '@common/modules/router/helpers'
import eventBus from '@common/services/event/eventBus'
import { storage } from '@common/services/storage'
import { Action, MethodAction } from '@common/types/actions'
import { BUNGEE_API_KEY, RELAYER_URL, VELCRO_URL } from '@env'
import { MobileBaseControllersMappingType } from '@mobile/constants/controllersMapping'
import { handleActions } from '@mobile/handlers/handleActions'

let mainControllerInstance: MainController | null = null
const fetchWithAnalytics: any = (url: any, init: any) => {
  const urlString = url.toString()
  try {
    const urlObj = new URL(urlString)
    if (!urlObj.hostname.endsWith('.ambire.com') && urlObj.hostname !== 'ambire.com') {
      return fetch(url, init)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    return fetch(url, init)
  }

  const initWithCustomHeaders = init || { headers: { 'x-app-source': '', 'x-app-version': '' } }
  initWithCustomHeaders.headers = initWithCustomHeaders.headers || {}

  if (mainControllerInstance?.keystore?.keyStoreUid) {
    // TODO: implement analytics headers if needed
  }

  return fetch(url, initWithCustomHeaders)
}

// --- POLYFILL FOR REACT NATIVE HERMES / METRO BIND BUG ---
// In certain cases on React Native, when a function with a TypeScript `this:` parameter
// and default arguments is compiled, the native `Function.prototype.bind` misaligns
// the injected arguments (specifically, offsets them by 1 because it counts the stripped `this`).
// The fix is to override `Function.prototype.bind` globally here before any controllers execute.

const originalBind = Function.prototype.bind
// @ts-ignore
Function.prototype.bind = function (context: any, ...boundArgs: any[]) {
  const targetFunction = this

  // We return an async closure by default because almost all bound functions
  // in the controllers that suffer from this bug are async or return promises (like relayerCall).
  // If a synchronous function throws an error, it will just throw synchronously.
  return function (...args: any[]) {
    try {
      // First, try standard execution
      const result = targetFunction.call(context, ...boundArgs, ...args)

      // If it's a promise, we must intercept rejections to catch the "bad method" error asynchronously
      if (result && typeof result.then === 'function') {
        return result.catch((e: any) => {
          if (e?.message === 'bad method' || e?.message?.includes('bad method')) {
            // Argument shift detected! Try with padded offset.
            return targetFunction.call(
              context,
              ...boundArgs,
              args[0],
              undefined, // Dummy pad
              args[1],
              args[2],
              args[3],
              args[4]
            )
          }
          throw e
        })
      }
      return result
    } catch (e: any) {
      if (e?.message === 'bad method' || e?.message?.includes('bad method')) {
        return targetFunction.call(
          context,
          ...boundArgs,
          args[0],
          undefined,
          args[1],
          args[2],
          args[3],
          args[4]
        )
      }
      throw e
    }
  }
}

export const ControllersMiddlewareProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const { controllerStore, debounceControllerUpdates } = useContext(ControllerStoreContext)

  const route = useRoute()
  const navigation = useNavigation()
  const navigationRef = useRef(navigation)

  useEffect(() => {
    navigationRef.current = navigation
  }, [navigation])
  const eventEmitterRegistry = useRef<EventEmitterRegistryController>(
    new EventEmitterRegistryController(() => {
      eventEmitterRegistry.current.values().forEach((ctrl) => {
        const hasOnUpdateInitialized = ctrl.onUpdateIds.includes('background')
        if (!hasOnUpdateInitialized) {
          ctrl.onUpdate(async (forceEmit) => {
            const res = debounceControllerUpdates(ctrl.name, ctrl, forceEmit)
            if (res === 'DEBOUNCED') return

            if (ctrl.name === 'KeystoreController') {
              const keystoreCtrl = ctrl as IKeystoreController
              if (keystoreCtrl.isReadyToStoreKeys) {
                // TODO: sentry
                // setBackgroundUserContext({
                //   id: getExtensionInstanceId(keystoreCtrl.keyStoreUid, mainCtrl.invite.verifiedCode)
                // })
                if (isUnlocked && !keystoreCtrl.isUnlocked) {
                  await (
                    controllers.current as MobileBaseControllersMappingType
                  ).MainController!.dapps.broadcastDappSessionEvent('lock')
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
          ctrl.onError(() => {
            eventBus.emit('error', { errors: ctrl.emittedErrors, controller: ctrl.name })
            // TODO: sentry
            // captureBackgroundExceptionFromControllerError(error, ctrl.name)
          }, 'background')
        }
      })
    })
  )

  const controllers = useRef<MobileBaseControllersMappingType>(
    {} as MobileBaseControllersMappingType
  )

  useEffect(() => {
    controllerStore.init(
      eventEmitterRegistry.current
        .values()
        .map((c) => c.name) as (keyof MobileBaseControllersMappingType)[],
      (allCtrls: (keyof AllControllersMappingType)[]) => {
        allCtrls.forEach((ctrlName) => {
          controllerStore.update(
            ctrlName,
            eventEmitterRegistry.current.values().find((c) => c.name === ctrlName) as any
          )
        })
      }
    )
  }, [controllerStore])

  if (Object.keys(controllers.current).length === 0) {
    const ctrls: MobileBaseControllersMappingType = {} as MobileBaseControllersMappingType
    ctrls.MainController = new MainController({
      eventEmitterRegistry: eventEmitterRegistry.current,
      appVersion: APP_VERSION,
      platform: `mobile-${RNPlatform.OS}` as any,
      storageAPI: storage,
      fetch: fetchWithAnalytics,
      relayerUrl: RELAYER_URL,
      velcroUrl: VELCRO_URL,
      liFiApiKey: LIFI_EXPLORER_URL,
      bungeeApiKey: BUNGEE_API_KEY,
      featureFlags: {},
      keystoreSigners: {
        internal: KeystoreSigner
      },
      externalSignerControllers: {},
      uiManager: {
        window: {
          open: async () => {
            const initialRoute = getInitialRoute({
              keystoreState: ctrls.MainController.keystore,
              requestsState: ctrls.MainController.requests,
              swapAndBridgeState: ctrls.MainController.swapAndBridge,
              transferState: ctrls.MainController.transfer
            })

            const currentPathname = navigationRef.current.searchParams.get('pathname') || route.pathname
            const currentRoute = currentPathname.startsWith('/')
              ? currentPathname.slice(1)
              : currentPathname

            if (initialRoute && initialRoute !== currentRoute) {
              navigationRef.current.navigate(initialRoute)
            }

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
            const initialRoute = getInitialRoute({
              keystoreState: ctrls.MainController.keystore,
              requestsState: ctrls.MainController.requests,
              swapAndBridgeState: ctrls.MainController.swapAndBridge,
              transferState: ctrls.MainController.transfer
            })

            const currentPathname = navigationRef.current.searchParams.get('pathname') || route.pathname
            const currentRoute = currentPathname.startsWith('/')
              ? currentPathname.slice(1)
              : currentPathname

            if (initialRoute && initialRoute !== currentRoute) {
              navigationRef.current.navigate(initialRoute)
            }
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
          remove: async () => {
            const initialRoute = getInitialRoute({
              keystoreState: ctrls.MainController.keystore,
              requestsState: ctrls.MainController.requests,
              swapAndBridgeState: ctrls.MainController.swapAndBridge,
              transferState: ctrls.MainController.transfer
            })

            const currentPathname = navigationRef.current.searchParams.get('pathname') || route.pathname
            const currentRoute = currentPathname.startsWith('/')
              ? currentPathname.slice(1)
              : currentPathname

            if (initialRoute && initialRoute !== currentRoute) {
              navigationRef.current.navigate(initialRoute)
            }
          },
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

    controllers.current = ctrls
    mainControllerInstance = ctrls.MainController
  }

  const dispatch = useCallback((action: MethodAction | Action) => {
    handleActions(action, {
      eventEmitterRegistry: eventEmitterRegistry.current,
      mainCtrl: controllers.current.MainController
    })
  }, [])

  useEffect(() => {
    controllers.current.MainController.ui.addView({
      id: 'default-mobile-app-view',
      type: 'mobile'
    })
  }, [])

  useEffect(() => {
    const { pathname = '/', search = '' } = route

    const searchParams = new URLSearchParams(search)
    const searchParamsFormatted = Object.fromEntries(searchParams.entries())

    dispatch({
      type: 'UPDATE_UI_VIEW_ROUTE',
      params: {
        id: 'default-mobile-app-view',
        route: pathname.startsWith('/') ? pathname.slice(1) : pathname,
        searchParams: searchParamsFormatted
      }
    })
  }, [route, dispatch])

  return (
    <ControllersMiddlewareContext.Provider value={useMemo(() => ({ dispatch }), [dispatch])}>
      {children}
    </ControllersMiddlewareContext.Provider>
  )
}
