import { networks } from 'ambire-common/src/consts/networks'
import { MainController } from 'ambire-common/src/controllers/main/main'
import { KeyIterator } from 'ambire-common/src/libs/keyIterator/keyIterator'
import { KeystoreSigner } from 'ambire-common/src/libs/keystoreSigner/keystoreSigner'
import { areRpcProvidersInitialized, initRpcProviders } from 'ambire-common/src/services/provider'

import { rpcProviders } from '@common/services/providers'
import { RELAYER_URL } from '@env'
import { NotificationController } from '@web/extension-services/background/controllers/notification'
import provider from '@web/extension-services/background/provider/provider'
import permissionService from '@web/extension-services/background/services/permission'
import sessionService from '@web/extension-services/background/services/session'
import { storage } from '@web/extension-services/background/webapi/storage'
import eventBus from '@web/extension-services/event/eventBus'
import PortMessage from '@web/extension-services/message/portMessage'
import { BIP44_HD_PATH } from '@web/modules/hardware-wallet/constants/hdPaths'
import LatticeController from '@web/modules/hardware-wallet/controllers/LatticeController'
import LedgerController from '@web/modules/hardware-wallet/controllers/LedgerController'
import TrezorController from '@web/modules/hardware-wallet/controllers/TrezorController'
import LatticeKeyIterator from '@web/modules/hardware-wallet/libs/latticeKeyIterator'
import LatticeSigner from '@web/modules/hardware-wallet/libs/LatticeSigner'
import LedgerKeyIterator from '@web/modules/hardware-wallet/libs/ledgerKeyIterator'
import LedgerSigner from '@web/modules/hardware-wallet/libs/LedgerSigner'
import TrezorKeyIterator from '@web/modules/hardware-wallet/libs/trezorKeyIterator'
import TrezorSigner from '@web/modules/hardware-wallet/libs/TrezorSigner'
import getOriginFromUrl from '@web/utils/getOriginFromUrl'

import { Action } from './actions'
import { controllersNestedInMainMapping } from './types'

async function init() {
  // Initialize rpc providers for all networks
  const shouldInitProviders = !areRpcProvidersInitialized()
  if (shouldInitProviders) {
    initRpcProviders(rpcProviders)
  }

  await permissionService.init()
}

;(async () => {
  await init()
  let pmRef: PortMessage
  let controllersNestedInMainSubscribe: any = null
  let onResoleDappNotificationRequest: (data: any, id?: bigint) => void
  let onRejectDappNotificationRequest: (data: any, id?: bigint) => void

  const signers = {
    internal: KeystoreSigner,
    ledger: LedgerSigner,
    trezor: TrezorSigner,
    lattice: LatticeSigner
  }

  const mainCtrl = new MainController({
    storage,
    fetch,
    relayerUrl: RELAYER_URL,
    keystoreSigners: signers,
    onResolveDappRequest: (data, id) => {
      !!onResoleDappNotificationRequest && onResoleDappNotificationRequest(data, id)
    },
    onRejectDappRequest: (err, id) => {
      !!onRejectDappNotificationRequest && onRejectDappNotificationRequest(err, id)
    },
    onUpdateDappSelectedAccount: (accountAddr) => {
      const account = accountAddr ? [accountAddr] : []
      return sessionService.broadcastEvent('accountsChanged', account)
    }
  })
  const ledgerCtrl = new LedgerController()
  const trezorCtrl = new TrezorController()
  trezorCtrl.init()
  const latticeCtrl = new LatticeController()
  const notificationCtrl = new NotificationController(mainCtrl)

  onResoleDappNotificationRequest = notificationCtrl.resolveNotificationRequest
  onRejectDappNotificationRequest = notificationCtrl.rejectNotificationRequest

  /**
   * Init all controllers `onUpdate` listeners only once (in here), instead of
   * doing it in the `browser.runtime.onConnect.addListener` listener, because
   * the `onUpdate` listeners are not supposed to be re-initialized every time
   * the `browser.runtime.onConnect.addListener` listener is called.
   * Moreover, this re-initialization happens multiple times per session,
   * `browser.runtime.onConnect.addListener` gets called multiple times,
   * and the `onUpdate` listeners skip emits from controllers (race condition).
   * Initializing the listeners only once proofs to be more reliable.
   */

  // Broadcast onUpdate for the main controllers
  mainCtrl.onUpdate(() => {
    pmRef?.request({
      type: 'broadcast',
      method: 'main',
      params: mainCtrl
    })

    if (!mainCtrl.isReady && controllersNestedInMainSubscribe) {
      controllersNestedInMainSubscribe = null
    }

    if (mainCtrl.isReady && !controllersNestedInMainSubscribe) {
      controllersNestedInMainSubscribe = () => {
        Object.keys(controllersNestedInMainMapping).forEach((ctrl: any) => {
          // Broadcast onUpdate for nested controllers
          ;(mainCtrl as any)[ctrl]?.onUpdate(() => {
            pmRef.request({
              type: 'broadcast',
              method: ctrl,
              params: (mainCtrl as any)[ctrl]
            })
          })
          ;(mainCtrl as any)[ctrl]?.onError(() => {
            const errors = (mainCtrl as any)[ctrl].getErrors()
            const lastError = errors[errors.length - 1]
            if (lastError) console.error(lastError.error)

            pmRef.request({
              type: 'broadcast-error',
              method: ctrl,
              params: { errors, controller: ctrl }
            })
          })
        })
      }
      controllersNestedInMainSubscribe()
    }
  })
  // Broadcast onUpdate for the notification controllers
  notificationCtrl.onUpdate(() => {
    pmRef?.request({
      type: 'broadcast',
      method: 'notification',
      params: notificationCtrl
    })
  })
  notificationCtrl.onError(() => {
    const errors = notificationCtrl.getErrors()
    const lastError = errors[errors.length - 1]
    if (lastError) console.error(lastError.error)

    pmRef?.request({
      type: 'broadcast-error',
      method: 'notification',
      params: { errors, controller: 'notification' }
    })
  })
  mainCtrl.onError(() => {
    const errors = mainCtrl.getErrors()
    const lastError = errors[errors.length - 1]
    if (lastError) console.error(lastError.error)

    pmRef?.request({
      type: 'broadcast-error',
      method: 'main',
      params: { errors, controller: 'main' }
    })
  })

  // listen for messages from UI
  browser.runtime.onConnect.addListener(async (port) => {
    if (port.name === 'popup' || port.name === 'notification' || port.name === 'tab') {
      const pm = new PortMessage(port)
      pmRef = pm

      pm.listen(async (data: Action) => {
        if (data?.type) {
          switch (data.type) {
            case 'broadcast':
              eventBus.emit(data.method, data.params)
              break
            case 'INIT_CONTROLLER_STATE': {
              if (data.params.controller === ('main' as any)) {
                pm.request({
                  type: 'broadcast',
                  method: 'main',
                  params: mainCtrl
                })
              } else if (data.params.controller === ('notification' as any)) {
                pm.request({
                  type: 'broadcast',
                  method: 'notification',
                  params: notificationCtrl
                })
              } else {
                pm.request({
                  type: 'broadcast',
                  method: data.params.controller,
                  params: (mainCtrl as any)[data.params.controller]
                })
              }
              break
            }
            case 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_LEDGER': {
              const keyIterator = new LedgerKeyIterator({
                hdk: ledgerCtrl.hdk,
                app: ledgerCtrl.app
              })
              return mainCtrl.accountAdder.init({
                ...data.params,
                keyIterator,
                preselectedAccounts: mainCtrl.accounts
              })
            }
            case 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_TREZOR': {
              const keyIterator = new TrezorKeyIterator({ hdk: trezorCtrl.hdk })
              return mainCtrl.accountAdder.init({
                ...data.params,
                keyIterator,
                preselectedAccounts: mainCtrl.accounts
              })
            }
            case 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_LATTICE': {
              const keyIterator = new LatticeKeyIterator({
                sdkSession: latticeCtrl.sdkSession,
                getHDPathIndices: latticeCtrl._getHDPathIndices
              })
              return mainCtrl.accountAdder.init({
                ...data.params,
                keyIterator,
                preselectedAccounts: mainCtrl.accounts
              })
            }
            case 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_PRIVATE_KEY_OR_SEED_PHRASE': {
              const keyIterator = new KeyIterator(data.params.privKeyOrSeed)
              return mainCtrl.accountAdder.init({
                keyIterator,
                preselectedAccounts: mainCtrl.accounts,
                derivationPath: BIP44_HD_PATH
              })
            }
            case 'MAIN_CONTROLLER_SELECT_ACCOUNT': {
              return mainCtrl.selectAccount(data.params.accountAddr)
            }
            case 'MAIN_CONTROLLER_ACCOUNT_ADDER_SELECT_ACCOUNT': {
              return mainCtrl.accountAdder.selectAccount(data.params.account)
            }
            case 'MAIN_CONTROLLER_ACCOUNT_ADDER_DESELECT_ACCOUNT': {
              return mainCtrl.accountAdder.deselectAccount(data.params.account)
            }
            case 'MAIN_CONTROLLER_ACCOUNT_ADDER_RESET': {
              return mainCtrl.accountAdder.reset()
            }
            case 'MAIN_CONTROLLER_ACCOUNT_ADDER_SET_PAGE':
              return mainCtrl.accountAdder.setPage({
                ...data.params,
                networks,
                providers: rpcProviders
              })
            case 'MAIN_CONTROLLER_ACCOUNT_ADDER_ADD_ACCOUNTS':
              return mainCtrl.accountAdder.addAccounts(data.params.accounts)
            case 'MAIN_CONTROLLER_ADD_USER_REQUEST':
              return mainCtrl.addUserRequest(data.params)
            case 'MAIN_CONTROLLER_REMOVE_USER_REQUEST':
              return mainCtrl.removeUserRequest(data.params.id)
            case 'MAIN_CONTROLLER_SIGN_MESSAGE_INIT':
              return mainCtrl.signMessage.init({
                messageToSign: data.params.messageToSign,
                accounts: data.params.accounts,
                accountStates: data.params.accountStates
              })
            case 'MAIN_CONTROLLER_SIGN_MESSAGE_RESET':
              return mainCtrl.signMessage.reset()
            case 'MAIN_CONTROLLER_SIGN_MESSAGE_SIGN':
              return mainCtrl.signMessage.sign()
            case 'MAIN_CONTROLLER_SIGN_MESSAGE_SET_SIGN_KEY':
              return mainCtrl.signMessage.setSigningKeyAddr(data.params.key)
            case 'MAIN_CONTROLLER_BROADCAST_SIGNED_MESSAGE':
              return mainCtrl.broadcastSignedMessage(data.params.signedMessage)
            case 'MAIN_CONTROLLER_ACTIVITY_INIT':
              return mainCtrl.activity.init({
                filters: data.params.filters
              })
            case 'MAIN_CONTROLLER_ACTIVITY_RESET':
              return mainCtrl.activity.reset()
            case 'NOTIFICATION_CONTROLLER_RESOLVE_REQUEST': {
              notificationCtrl.resolveNotificationRequest(data.params.data, data.params.id)
              break
            }
            case 'NOTIFICATION_CONTROLLER_REJECT_REQUEST': {
              notificationCtrl.rejectNotificationRequest(data.params.err)
              break
            }

            case 'NOTIFICATION_CONTROLLER_OPEN_FIRST_NOTIFICATION_REQUEST':
              return notificationCtrl.openFirstNotificationRequest()

            case 'LEDGER_CONTROLLER_UNLOCK':
              return ledgerCtrl.unlock(data?.params?.hdPath)
            case 'LEDGER_CONTROLLER_GET_PATH_FOR_INDEX':
              return ledgerCtrl._getPathForIndex(data.params)
            case 'LEDGER_CONTROLLER_APP':
              return ledgerCtrl.app
            case 'LEDGER_CONTROLLER_AUTHORIZE_HID_PERMISSION':
              return ledgerCtrl.authorizeHIDPermission()

            case 'TREZOR_CONTROLLER_UNLOCK':
              return trezorCtrl.unlock()

            case 'LATTICE_CONTROLLER_UNLOCK':
              return latticeCtrl.unlock()

            case 'MAIN_CONTROLLER_UPDATE_SELECTED_ACCOUNT': {
              if (!mainCtrl.selectedAccount) return
              return mainCtrl.updateSelectedAccount(mainCtrl.selectedAccount)
            }
            case 'KEYSTORE_CONTROLLER_ADD_SECRET':
              return mainCtrl.keystore.addSecret(
                data.params.secretId,
                data.params.secret,
                data.params.extraEntropy,
                data.params.leaveUnlocked
              )
            case 'KEYSTORE_CONTROLLER_ADD_KEYS_EXTERNALLY_STORED': {
              const { type, model, hdPath } = trezorCtrl

              const keys = mainCtrl.accountAdder.selectedAccounts.map(({ eoaAddress, slot }) => ({
                id: eoaAddress,
                type,
                label: `Trezor on slot ${slot}`,
                meta: { model, hdPath }
              }))

              return mainCtrl.keystore.addKeysExternallyStored(keys)
            }
            case 'KEYSTORE_CONTROLLER_UNLOCK_WITH_SECRET':
              return mainCtrl.keystore.unlockWithSecret(data.params.secretId, data.params.secret)
            case 'KEYSTORE_CONTROLLER_LOCK':
              return mainCtrl.keystore.lock()
            case 'KEYSTORE_CONTROLLER_ADD_KEYS':
              return mainCtrl.keystore.addKeys(data.params.keys)
            case 'KEYSTORE_CONTROLLER_RESET_ERROR_STATE':
              return mainCtrl.keystore.resetErrorState()

            case 'WALLET_CONTROLLER_GET_CONNECTED_SITE':
              return permissionService.getConnectedSite(data.params.origin)
            case 'WALLET_CONTROLLER_GET_CONNECTED_SITES':
              return permissionService.getConnectedSites()
            case 'WALLET_CONTROLLER_REQUEST_VAULT_CONTROLLER_METHOD':
              return null // TODO: Implement in v2
            case 'WALLET_CONTROLLER_SET_STORAGE':
              return sessionService.broadcastEvent(data.params.key, data.params.value)
            case 'WALLET_CONTROLLER_GET_CURRENT_SITE': {
              const { tabId, domain } = data.params
              const { origin, name, icon } = sessionService.getSession(`${tabId}-${domain}`) || {}
              if (!origin) return null

              const site = permissionService.getSite(origin)
              if (site) return site

              return {
                origin,
                name: name!,
                icon: icon!,
                isConnected: false,
                isSigned: false,
                isTop: false
              }
            }
            case 'WALLET_CONTROLLER_REMOVE_CONNECTED_SITE': {
              sessionService.broadcastEvent('accountsChanged', [], data.params.origin)
              permissionService.removeConnectedSite(data.params.origin)
              break
            }

            default:
              return console.error(
                `Dispatched ${data?.type} action, but handler in the extension background process not found!`
              )
          }
        }
      })

      const broadcastCallback = (data: any) => {
        pm.request({
          type: 'broadcast',
          method: data.method,
          params: data.params
        })
      }

      if (port.name === 'tab' || port.name === 'notification') {
        port.onDisconnect.addListener(() => {
          ledgerCtrl.cleanUp()
          trezorCtrl.cleanUp()
        })
      }
      eventBus.addEventListener('broadcastToUI', broadcastCallback)
      port.onDisconnect.addListener(() => {
        eventBus.removeEventListener('broadcastToUI', broadcastCallback)
      })

      return
    }

    if (!port.sender?.tab) {
      return
    }

    const pm = new PortMessage(port)

    pm.listen(async (data: any) => {
      const sessionId = port.sender?.tab?.id
      if (sessionId === undefined || !port.sender?.url) {
        return
      }

      const origin = getOriginFromUrl(port.sender.url)
      const session = sessionService.getOrCreateSession(sessionId, origin)

      const req = { data, session, origin }
      // for background push to respective page
      req.session!.setPortMessage(pm)

      // Temporarily resolves the subscription methods as successful
      // but the rpc block subscription is actually not implemented because it causes app crashes
      if (data?.method === 'eth_subscribe' || data?.method === 'eth_unsubscribe') {
        return true
      }

      return provider({ ...req, mainCtrl, notificationCtrl })
    })
  })
})()

// On first install, open Ambire Extension in a new tab to start the login process
browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    const extensionURL = browser.runtime.getURL('tab.html')
    browser.tabs.create({ url: extensionURL })
  }
})
