import { EventEmitter as Emitter } from 'events'
/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { networks } from '@ambire-common/consts/networks'
import { ContractNamesController } from '@ambire-common/controllers/contractNames/contractNames'
import { DomainsController } from '@ambire-common/controllers/domains/domains'
import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { EventEmitterRegistryController } from '@ambire-common/controllers/eventEmitterRegistry/eventEmitterRegistry'
import { MainController } from '@ambire-common/controllers/main/main'
import { ProvidersController } from '@ambire-common/controllers/providers/providers'
import { StorageController } from '@ambire-common/controllers/storage/storage'
import { ErrorRef } from '@ambire-common/interfaces/eventEmitter'
import { IKeystoreController } from '@ambire-common/interfaces/keystore'
import { WindowProps } from '@ambire-common/interfaces/ui'
import { KeystoreSigner } from '@ambire-common/libs/keystoreSigner/keystoreSigner'
import { LIFI_EXPLORER_URL } from '@ambire-common/services/lifi/consts'
import { APP_VERSION } from '@common/config/env'
import { ControllersMappingType } from '@common/constants/controllersMapping'
import { ToastOptions } from '@common/contexts/toastContext'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import { BUNGEE_API_KEY, RELAYER_URL, VELCRO_URL } from '@env'
import { Action } from '@web/extension-services/background/actions'
import { WalletStateController } from '@web/extension-services/background/controllers/wallet-state'
import { storage } from '@web/extension-services/background/webapi/storage'
import eventBus from '@web/extension-services/event/eventBus'

import { ControllersMiddlewareContext } from './context'
import { ControllerStore } from './controllerStore'
import { AnyControllerAction } from './types'

export const CommonControllersMiddlewareProvider: React.FC<{
  children: React.ReactNode
  env: 'mobile' | 'explorer' | 'rewards'
}> = ({ children, env }) => {
  const { addToast } = useToast()
  const { navigate } = useNavigation()
  const [isUnlocked, setIsUnlocked] = useState(false)
  const ctrlOnUpdateIsDirtyFlags = useRef<Record<string, boolean>>({})
  const [isStoreReady, setIsStoreReady] = useState(false)

  const debounceControllerUpdates = useCallback(
    (ctrlName: string, ctrl: EventEmitter, forceEmit?: boolean): 'DEBOUNCED' | 'EMITTED' => {
      if (forceEmit) {
        eventBus.emit(ctrlName, ctrl.toJSON(), forceEmit)
        controllerStore.current.update(ctrlName as any, ctrl, forceEmit)

        return 'EMITTED'
      }

      if (ctrlOnUpdateIsDirtyFlags.current[ctrlName]) return 'DEBOUNCED'
      ctrlOnUpdateIsDirtyFlags.current[ctrlName] = true
      // Debounce multiple emits in the same tick and only execute one of them
      setTimeout(() => {
        if (ctrlOnUpdateIsDirtyFlags.current[ctrlName]) {
          eventBus.emit(ctrlName, ctrl.toJSON(), forceEmit)
          controllerStore.current.update(ctrlName as any, ctrl, forceEmit)
        }
        ctrlOnUpdateIsDirtyFlags.current[ctrlName] = false
      }, 0)

      return 'EMITTED'
    },
    []
  )

  const controllerStore = useRef<ControllerStore>(
    new ControllerStore({
      onInit: () => {
        return Object.values(controllers.current).map((ctrl) => {
          const ctrlName = ctrl.name as keyof ControllersMappingType
          controllerStore.current.update(ctrlName, ctrl)

          return ctrlName
        })
      },
      onReady: () => {
        setIsStoreReady(true)
      }
    })
  )

  useEffect(() => {
    controllerStore.current.init()
  }, [])

  const eventEmitterRegistry = useRef<EventEmitterRegistryController>(
    new EventEmitterRegistryController(() => {
      eventEmitterRegistry.current.values().forEach((ctrl) => {
        const hasOnUpdateInitialized = ctrl.onUpdateIds.includes('background')
        if (!hasOnUpdateInitialized) {
          ctrl.onUpdate(async (forceEmit) => {
            const res = debounceControllerUpdates(ctrl.name, ctrl, forceEmit)
            if (res === 'DEBOUNCED' || env !== 'mobile') return

            if (ctrl.name === 'KeystoreController') {
              const keystoreCtrl = ctrl as IKeystoreController
              if (keystoreCtrl.isReadyToStoreKeys) {
                // TODO: sentry
                // setBackgroundUserContext({
                //   id: getExtensionInstanceId(keystoreCtrl.keyStoreUid, mainCtrl.invite.verifiedCode)
                // })
                if (isUnlocked && !keystoreCtrl.isUnlocked) {
                  await controllers.current.main!.dapps.broadcastDappSessionEvent('lock')
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

  const controllers = useRef<{
    walletState?: WalletStateController
    main?: MainController
    providers?: ProvidersController
    domains?: DomainsController
    contractNames?: ContractNamesController
  }>(
    (() => {
      const ctrls: {
        walletState?: WalletStateController
        main?: MainController
        providers?: ProvidersController
        domains?: DomainsController
        contractNames?: ContractNamesController
      } = {}

      if (env === 'mobile') {
        ctrls.walletState = new WalletStateController({
          eventEmitterRegistry: eventEmitterRegistry.current,
          onLogLevelUpdateCallback: async () => {}
        })
        ctrls.main = new MainController({
          eventEmitterRegistry: eventEmitterRegistry.current,
          appVersion: APP_VERSION,
          platform: 'default',
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
      } else if (env === 'explorer') {
        const storageCtrl = new StorageController(storage)
        ctrls.providers = new ProvidersController({
          eventEmitterRegistry: eventEmitterRegistry.current,
          storage: storageCtrl,
          getNetworks: () => networks,
          sendUiMessage: (params) => {
            eventBus.emit('receiveOneTimeData', params)
          }
        })

        ctrls.domains = new DomainsController({
          eventEmitterRegistry: eventEmitterRegistry.current,
          providers: ctrls.providers.providers
        })

        ctrls.contractNames = new ContractNamesController({
          eventEmitterRegistry: eventEmitterRegistry.current,
          fetch: fetchWithAnalytics
        })
      } else if (env === 'rewards') {
        const storageCtrl = new StorageController(storage)
        ctrls.providers = new ProvidersController({
          eventEmitterRegistry: eventEmitterRegistry.current,
          storage: storageCtrl,
          getNetworks: () => networks,
          sendUiMessage: (params) => {
            eventBus.emit('receiveOneTimeData', params)
          }
        })

        ctrls.domains = new DomainsController({
          eventEmitterRegistry: eventEmitterRegistry.current,
          providers: ctrls.providers.providers
        })
      }

      return ctrls
    })()
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
    if (action.type === 'method') {
      const { ctrlName, method, args } = action.params

      let targetCtrl: any = Object.values(controllers.current as any).find(
        (ctrl: any) => ctrl.name === ctrlName
      )
      if (!targetCtrl) {
        console.error(`handleAction: Controller ${ctrlName} not found`)

        return
      }

      if (targetCtrl && typeof targetCtrl[method] === 'function') {
        targetCtrl[method](...args)
      }

      return
    }

    //TODO: handle common actions for the mobile app
  }, [])

  return (
    <ControllersMiddlewareContext.Provider
      value={useMemo(
        () => ({ dispatch, controllerStore: controllerStore.current, isStoreReady }),
        [dispatch, isStoreReady]
      )}
    >
      {children}
    </ControllersMiddlewareContext.Provider>
  )
}
