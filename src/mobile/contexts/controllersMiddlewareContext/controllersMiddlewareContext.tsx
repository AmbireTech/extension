import { EventEmitter as Emitter } from 'events'
/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Platform as RNPlatform } from 'react-native'

import { EventEmitterRegistryController } from '@ambire-common/controllers/eventEmitterRegistry/eventEmitterRegistry'
import { MainController } from '@ambire-common/controllers/main/main'
import { relayerCall } from '@ambire-common/libs/relayerCall/relayerCall'
import { IKeystoreController } from '@ambire-common/interfaces/keystore'
import { WindowProps } from '@ambire-common/interfaces/ui'
import { KeystoreSigner } from '@ambire-common/libs/keystoreSigner/keystoreSigner'
import { LIFI_EXPLORER_URL } from '@ambire-common/services/lifi/consts'
import { APP_VERSION } from '@common/config/env'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import useRoute from '@common/hooks/useRoute'
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

// Monkey-patch relayerCall.bind globally to bypass Hermes/Babel argument shifting bugs
// associated with bound functions that had a TypeScript `this` parameter.
const originalBind = relayerCall.bind
// @ts-ignore
relayerCall.bind = function (context: any, ...boundArgs: any[]) {
  return async function (...args: any[]) {
    try {
      // First, try a standard closure call.
      // @ts-ignore
      return await (relayerCall as any).call(context, ...boundArgs, ...args)
    } catch (e: any) {
      // If Babel/Hermes shifted default parameters (e.g. method=GET) because it counted the
      // stripped `this` keyword as an argument, we will encounter a "bad method" error here
      // because `method` read from `arguments[2]` instead of `arguments[1]`.
      if (e?.message === 'bad method' || e?.message?.includes('bad method')) {
        // Pad the arguments to realign the Babel `arguments[n]` indexes.
        // Inserting a dummy `undefined` at index 1 offsets everything cleanly.
        // @ts-ignore
        return await (relayerCall as any).call(
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
  const { controllerStore, isStoreReady, debounceControllerUpdates } =
    useContext(ControllerStoreContext)

  const route = useRoute()

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

  // fetchWithAnalytics moved outside the component

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
