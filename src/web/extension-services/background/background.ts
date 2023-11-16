/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-shadow */
import {
  BIP44_LEDGER_DERIVATION_TEMPLATE,
  BIP44_STANDARD_DERIVATION_TEMPLATE,
  HD_PATH_TEMPLATE_TYPE
} from '@ambire-common/consts/derivation'
import humanizerJSON from '@ambire-common/consts/humanizerInfo.json'
import { networks } from '@ambire-common/consts/networks'
import { MainController } from '@ambire-common/controllers/main/main'
import { ExternalKey } from '@ambire-common/interfaces/keystore'
import { KeyIterator } from '@ambire-common/libs/keyIterator/keyIterator'
import { KeystoreSigner } from '@ambire-common/libs/keystoreSigner/keystoreSigner'
import { areRpcProvidersInitialized, initRpcProviders } from '@ambire-common/services/provider'
import { pinnedTokens } from '@common/constants/tokens'
import { rpcProviders } from '@common/services/providers'
import { RELAYER_URL } from '@env'
import { BadgesController } from '@web/extension-services/background/controllers/badges'
import { NotificationController } from '@web/extension-services/background/controllers/notification'
import provider from '@web/extension-services/background/provider/provider'
import permissionService from '@web/extension-services/background/services/permission'
import sessionService from '@web/extension-services/background/services/session'
import { storage } from '@web/extension-services/background/webapi/storage'
import eventBus from '@web/extension-services/event/eventBus'
import PortMessage from '@web/extension-services/message/portMessage'
import { getPreselectedAccounts } from '@web/modules/account-adder/helpers/account'
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
import { AccountOpStatus } from '@ambire-common/libs/accountOp/accountOp'
import { SubmittedAccountOp } from '@ambire-common/controllers/activity/activity'

async function init() {
  // Initialize rpc providers for all networks
  const shouldInitProviders = !areRpcProvidersInitialized()
  if (shouldInitProviders) {
    initRpcProviders(rpcProviders)
  }

  // Initialize humanizer in storage
  const humanizerMetaInStorage = await storage.get('HumanizerMeta', {})
  if (Object.keys(humanizerMetaInStorage).length < Object.keys(humanizerJSON).length) {
    await storage.set('HumanizerMeta', humanizerJSON)
  }

  await permissionService.init()
}
;(async () => {
  await init()
  const portMessageUIRefs: { [key: string]: PortMessage } = {}
  let onResoleDappNotificationRequest: (data: any, id?: number) => void
  let onRejectDappNotificationRequest: (data: any, id?: number) => void

  const mainCtrl = new MainController({
    storage,
    // popup pages dont have access to fetch. Error: Failed to execute 'fetch' on 'Window': Illegal invocation
    // binding window to fetch provides the correct context
    fetch: window.fetch.bind(window),
    relayerUrl: RELAYER_URL,
    keystoreSigners: {
      internal: KeystoreSigner,
      // TODO: there is a mismatch in hw signer types, it's not a big deal
      ledger: LedgerSigner,
      trezor: TrezorSigner,
      lattice: LatticeSigner
    },
    onResolveDappRequest: (data, id) => {
      !!onResoleDappNotificationRequest && onResoleDappNotificationRequest(data, id)
    },
    onRejectDappRequest: (err, id) => {
      !!onRejectDappNotificationRequest && onRejectDappNotificationRequest(err, id)
    },
    onUpdateDappSelectedAccount: (accountAddr) => {
      const account = accountAddr ? [accountAddr] : []
      return sessionService.broadcastEvent('accountsChanged', account)
    },
    onBroadcastSuccess: (type: 'message' | 'typed-data' | 'account-op') => {
      notifyForSuccessfulBroadcast(type)
      setAccountStateInterval(accountStateIntervals.pending)
    },
    pinned: pinnedTokens
  })
  const ledgerCtrl = new LedgerController()
  const trezorCtrl = new TrezorController()
  const latticeCtrl = new LatticeController()
  const notificationCtrl = new NotificationController(mainCtrl)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const badgesCtrl = new BadgesController(mainCtrl, notificationCtrl)

  let fetchPortfolioIntervalId: any
  /** ctrlOnUpdateIsDirtyFlags will be set to true for a given ctrl
  when it receives an update in the ctrl.onUpdate callback. While the flag is truthy and there are new updates coming for that ctrl
  in the same tick, they will be debounced and only one event will be executed at the end */
  const ctrlOnUpdateIsDirtyFlags: { [key: string]: boolean } = {}
  /** Will be assigned with a function that initialized the on update listeners
  for the nested controllers in main. Serves for checking whether the listeners are already set
  to avoid duplicated/multiple instanced of the onUpdate callbacks for a given ctrl to be initialized in the background */
  let controllersNestedInMainSubscribe: any = null

  onResoleDappNotificationRequest = notificationCtrl.resolveNotificationRequest
  onRejectDappNotificationRequest = notificationCtrl.rejectNotificationRequest

  const fetchPortfolioData = async () => {
    if (!mainCtrl.selectedAccount) return
    return mainCtrl.updateSelectedAccount(mainCtrl.selectedAccount)
  }

  fetchPortfolioData()

  function setPortfolioFetchInterval() {
    clearInterval(fetchPortfolioIntervalId) // Clear existing interval
    fetchPortfolioIntervalId = setInterval(
      () => fetchPortfolioData(),
      // In the case we have an active extension (opened tab, popup, notification),
      // we want to run the interval frequently (1 minute).
      // Otherwise, when inactive we want to run it once in a while (10 minutes).
      Object.keys(portMessageUIRefs).length ? 60000 : 600000
    )
  }

  // Call it once to initialize the interval
  setPortfolioFetchInterval()

  let activityIntervalId: any
  function setActivityInterval(timeout: number) {
    clearInterval(activityIntervalId) // Clear existing interval
    activityIntervalId = setInterval(() => mainCtrl.updateAccountsOpsStatuses(), timeout)
  }

  // refresh the account state once every 5 minutes.
  // if there are BroadcastedButNotConfirmed account ops, start refreshing
  //  once every 7.5 seconds until they are cleared
  let accountStateInternval: any
  let selectedAccountStateInterval: any
  const accountStateIntervals = {
    pending: 7500,
    standBy: 300000,
  }

  function setAccountStateInterval(intervalLength: number) {
    clearInterval(accountStateInternval)
    selectedAccountStateInterval = intervalLength

    accountStateInternval = setInterval(
      async () => {
        // update the account state with the latest block in normal
        // circumstances and with the pending block when there are
        // pending account ops
        const blockTag = selectedAccountStateInterval === accountStateIntervals.standBy
          ? 'latest'
          : 'pending'
        mainCtrl.updateAccountStates(blockTag)

        if (selectedAccountStateInterval == accountStateIntervals.standBy) {
          return
        }

        // if we don't have any account ops, set the refresh rate to standBy
        const accountsOps = await storage.get('accountsOps', {})
        if (!accountsOps) {
          setAccountStateInterval(accountStateIntervals.standBy)
          return
        }

        /**
         * Pass the accountOps for a single account and check whether
         * it has pending ops on any network
         *
         * @param accountOps the account ops for a single account
         * @returns boolean
         */
        const hasAccountNotConfirmedOps = (accountOps: any): boolean => {
          for (const network in accountOps) {
            if (
              accountOps[network].filter((accOp: SubmittedAccountOp) => {
                return accOp.status == AccountOpStatus.BroadcastedButNotConfirmed
              }).length > 0
            ) return true
          }
          return false
        }

        /**
         * Check if there are any pending account ops for all of
         * the user accounts accross networks
         *
         * @param accountsOps InternalAccountsOps
         * @returns boolean
         */
        const hasNotConfirmedOps = (accountsOps: any): boolean => {
          for (const account in accountsOps) {
            if (hasAccountNotConfirmedOps(accountsOps[account])) return true
          }
          return false
        }

        // check for pending account ops
        // if there aren't any, set the refresh rate to standBy
        if (!hasNotConfirmedOps(accountsOps)) {
          setAccountStateInterval(accountStateIntervals.standBy)
        }
      },
      intervalLength
    )
  }
  // Call it once to initialize the interval
  setAccountStateInterval(accountStateIntervals.standBy)

  /**
   * We have the capability to incorporate multiple onUpdate callbacks for a specific controller, allowing multiple listeners for updates in different files.
   * However, in the context of this background service, we only need a single instance of the onUpdate callback for each controller.
   */

  /**
   * Initialize the onUpdate callback for the MainController.
   * Once the mainCtrl load is ready, initialize the rest of the onUpdate callbacks for the nested controllers of the main controller.
   */
  mainCtrl.onUpdate(() => {
    if (ctrlOnUpdateIsDirtyFlags.main) return
    ctrlOnUpdateIsDirtyFlags.main = true

    // Debounce multiple emits in the same tick and only execute one if them
    setTimeout(() => {
      if (ctrlOnUpdateIsDirtyFlags.main) {
        Object.keys(portMessageUIRefs).forEach((key: string) => {
          portMessageUIRefs[key]?.request({
            type: 'broadcast',
            method: 'main',
            params: mainCtrl
          })
        })
      }
      ctrlOnUpdateIsDirtyFlags.main = false
    }, 0)

    if (!mainCtrl.isReady && controllersNestedInMainSubscribe) {
      controllersNestedInMainSubscribe = null
    }

    if (mainCtrl.isReady && !controllersNestedInMainSubscribe) {
      controllersNestedInMainSubscribe = () => {
        Object.keys(controllersNestedInMainMapping).forEach((ctrl: any) => {
          // Broadcast onUpdate for the nested controllers in main
          ;(mainCtrl as any)[ctrl]?.onUpdate(() => {
            if (ctrlOnUpdateIsDirtyFlags[ctrl]) return
            ctrlOnUpdateIsDirtyFlags[ctrl] = true

            if (ctrl === 'activity') {
              // Start the interval for updating the accounts ops statuses,
              // only if there are broadcasted but not confirmed accounts ops
              if ((mainCtrl as any)[ctrl]?.broadcastedButNotConfirmed.length) {
                // If the interval is already set, then do nothing.
                if (!activityIntervalId) {
                  setActivityInterval(5000)
                }
              } else {
                clearInterval(activityIntervalId)
                activityIntervalId = null
              }
            }

            setTimeout(() => {
              if (ctrlOnUpdateIsDirtyFlags[ctrl]) {
                Object.keys(portMessageUIRefs).forEach((key: string) => {
                  portMessageUIRefs[key]?.request({
                    type: 'broadcast',
                    method: ctrl,
                    params: (mainCtrl as any)[ctrl]
                  })
                })
              }
              ctrlOnUpdateIsDirtyFlags[ctrl] = false
            }, 0)
          })
          ;(mainCtrl as any)[ctrl]?.onError(() => {
            const errors = (mainCtrl as any)[ctrl].getErrors()
            const lastError = errors[errors.length - 1]
            if (lastError) console.error(lastError.error)
            Object.keys(portMessageUIRefs).forEach((key: string) => {
              portMessageUIRefs[key]?.request({
                type: 'broadcast-error',
                method: ctrl,
                params: { errors, controller: ctrl }
              })
            })
          })
        })
      }
      controllersNestedInMainSubscribe()
    }

    if (mainCtrl.isReady && mainCtrl.selectedAccount) {
      fetchPortfolioData()
    }
  })
  mainCtrl.onError(() => {
    const errors = mainCtrl.getErrors()
    const lastError = errors[errors.length - 1]
    if (lastError) console.error(lastError.error)
    Object.keys(portMessageUIRefs).forEach((key: string) => {
      portMessageUIRefs[key]?.request({
        type: 'broadcast-error',
        method: 'main',
        params: { errors, controller: 'main' }
      })
    })
  })

  // Broadcast onUpdate for the notification controller
  notificationCtrl.onUpdate(() => {
    if (ctrlOnUpdateIsDirtyFlags.notification) return
    ctrlOnUpdateIsDirtyFlags.notification = true
    // Debounce multiple emits in the same tick and only execute one if them
    setTimeout(() => {
      if (ctrlOnUpdateIsDirtyFlags.notification) {
        Object.keys(portMessageUIRefs).forEach((key: string) => {
          portMessageUIRefs[key]?.request({
            type: 'broadcast',
            method: 'notification',
            params: notificationCtrl
          })
        })
      }
      ctrlOnUpdateIsDirtyFlags.notification = false
    }, 0)
  })
  notificationCtrl.onError(() => {
    const errors = notificationCtrl.getErrors()
    const lastError = errors[errors.length - 1]
    if (lastError) console.error(lastError.error)
    Object.keys(portMessageUIRefs).forEach((key: string) => {
      portMessageUIRefs[key]?.request({
        type: 'broadcast-error',
        method: 'notification',
        params: { errors, controller: 'notification' }
      })
    })
  })

  // listen for messages from UI
  browser.runtime.onConnect.addListener(async (port) => {
    if (port.name === 'popup' || port.name === 'notification' || port.name === 'tab') {
      const id = new Date().getTime().toString()
      const pm = new PortMessage(port, id)
      portMessageUIRefs[pm.id] = pm
      setPortfolioFetchInterval()

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
                keyIterator,
                preselectedAccounts: getPreselectedAccounts(
                  mainCtrl.accounts,
                  mainCtrl.keystore.keys,
                  'ledger'
                ),
                hdPathTemplate: BIP44_LEDGER_DERIVATION_TEMPLATE
              })
            }
            case 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_TREZOR': {
              const keyIterator = new TrezorKeyIterator({ hdk: trezorCtrl.hdk })
              return mainCtrl.accountAdder.init({
                keyIterator,
                hdPathTemplate: BIP44_STANDARD_DERIVATION_TEMPLATE,
                preselectedAccounts: getPreselectedAccounts(
                  mainCtrl.accounts,
                  mainCtrl.keystore.keys,
                  'trezor'
                )
              })
            }
            case 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_LATTICE': {
              const keyIterator = new LatticeKeyIterator({
                sdkSession: latticeCtrl.sdkSession
              })
              return mainCtrl.accountAdder.init({
                keyIterator,
                hdPathTemplate: BIP44_STANDARD_DERIVATION_TEMPLATE,
                preselectedAccounts: getPreselectedAccounts(
                  mainCtrl.accounts,
                  mainCtrl.keystore.keys,
                  'lattice'
                )
              })
            }
            case 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_PRIVATE_KEY_OR_SEED_PHRASE': {
              const keyIterator = new KeyIterator(data.params.privKeyOrSeed)
              return mainCtrl.accountAdder.init({
                keyIterator,
                hdPathTemplate: BIP44_STANDARD_DERIVATION_TEMPLATE,
                preselectedAccounts: getPreselectedAccounts(
                  mainCtrl.accounts,
                  mainCtrl.keystore.keys,
                  'internal'
                )
              })
            }
            case 'MAIN_CONTROLLER_SETTINGS_ADD_ACCOUNT_PREFERENCES': {
              return mainCtrl.settings.addAccountPreferences(data.params)
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
              return mainCtrl.accountAdder.addAccounts(data.params.selectedAccounts)
            case 'MAIN_CONTROLLER_ADD_ACCOUNTS':
              return mainCtrl.addAccounts(data.params.accounts)
            case 'MAIN_CONTROLLER_ADD_USER_REQUEST':
              return mainCtrl.addUserRequest(data.params)
            case 'MAIN_CONTROLLER_REMOVE_USER_REQUEST':
              return mainCtrl.removeUserRequest(data.params.id)
            case 'MAIN_CONTROLLER_REFETCH_PORTFOLIO':
              return fetchPortfolioData()
            case 'MAIN_CONTROLLER_SIGN_MESSAGE_INIT':
              return mainCtrl.signMessage.init({
                messageToSign: data.params.messageToSign,
                accounts: data.params.accounts,
                accountStates: data.params.accountStates
              })
            case 'MAIN_CONTROLLER_SIGN_MESSAGE_RESET':
              return mainCtrl.signMessage.reset()
            case 'MAIN_CONTROLLER_SIGN_MESSAGE_SIGN': {
              if (mainCtrl.signMessage.signingKeyType === 'ledger')
                return mainCtrl.signMessage.sign(ledgerCtrl)
              if (mainCtrl.signMessage.signingKeyType === 'trezor')
                return mainCtrl.signMessage.sign(trezorCtrl)
              if (mainCtrl.signMessage.signingKeyType === 'lattice')
                return mainCtrl.signMessage.sign(latticeCtrl)

              return mainCtrl.signMessage.sign()
            }
            case 'MAIN_CONTROLLER_SIGN_MESSAGE_SET_SIGN_KEY':
              return mainCtrl.signMessage.setSigningKey(data.params.key, data.params.type)
            case 'MAIN_CONTROLLER_BROADCAST_SIGNED_MESSAGE':
              return mainCtrl.broadcastSignedMessage(data.params.signedMessage)
            case 'MAIN_CONTROLLER_ACTIVITY_INIT':
              return mainCtrl.activity.init({
                filters: data.params.filters
              })
            case 'MAIN_CONTROLLER_ACTIVITY_RESET':
              return mainCtrl.activity.reset()

            case 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE_MAIN_DEPS':
              return mainCtrl.signAccountOp.updateMainDeps(data.params)
            case 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE':
              return mainCtrl.signAccountOp.update(data.params)
            case 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_SIGN':
              return mainCtrl.signAccountOp.sign()
            case 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_ESTIMATE':
              return mainCtrl.reestimateAndUpdatePrices(
                data.params.accountAddr,
                data.params.networkId
              )
            case 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_RESET':
              return mainCtrl.signAccountOp.reset()
            case 'MAIN_CONTROLLER_BROADCAST_SIGNED_ACCOUNT_OP':
              return mainCtrl.broadcastSignedAccountOp(data.params.accountOp)

            case 'MAIN_CONTROLLER_TRANSFER_UPDATE':
              return mainCtrl.transfer.update(data.params)
            case 'MAIN_CONTROLLER_TRANSFER_RESET_FORM':
              return mainCtrl.transfer.resetForm()
            case 'MAIN_CONTROLLER_TRANSFER_BUILD_USER_REQUEST':
              return mainCtrl.transfer.buildUserRequest()
            case 'MAIN_CONTROLLER_TRANSFER_ON_RECIPIENT_ADDRESS_CHANGE':
              return mainCtrl.transfer.onRecipientAddressChange()
            case 'MAIN_CONTROLLER_TRANSFER_HANDLE_TOKEN_CHANGE':
              return mainCtrl.transfer.handleTokenChange(data.params.tokenAddressAndNetwork)
            case 'NOTIFICATION_CONTROLLER_RESOLVE_REQUEST': {
              notificationCtrl.resolveNotificationRequest(data.params.data, data.params.id)
              break
            }
            case 'NOTIFICATION_CONTROLLER_REJECT_REQUEST': {
              notificationCtrl.rejectNotificationRequest(data.params.err, data.params.id)
              break
            }

            case 'NOTIFICATION_CONTROLLER_REOPEN_CURRENT_NOTIFICATION_REQUEST':
              return notificationCtrl.reopenCurrentNotificationRequest()
            case 'NOTIFICATION_CONTROLLER_OPEN_NOTIFICATION_REQUEST':
              return notificationCtrl.openNotificationRequest(data.params.id)

            case 'LEDGER_CONTROLLER_UNLOCK':
              return ledgerCtrl.unlock()
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
              const { keyType } = data.params

              const deviceIds: { [key in ExternalKey['type']]: string } = {
                ledger: ledgerCtrl.deviceId,
                trezor: trezorCtrl.deviceId,
                lattice: latticeCtrl.deviceId
              }

              const deviceModels: { [key in ExternalKey['type']]: string } = {
                ledger: ledgerCtrl.deviceModel,
                trezor: trezorCtrl.deviceModel,
                lattice: latticeCtrl.deviceModel
              }

              const keyWalletNames: { [key in ExternalKey['type']]: string } = {
                ledger: 'Ledger',
                trezor: 'Trezor',
                lattice: 'Lattice'
              }

              const keys = mainCtrl.accountAdder.selectedAccounts.map(
                ({ accountKeyAddr, slot, index }) => ({
                  addr: accountKeyAddr,
                  type: keyType,
                  label: `${keyWalletNames[keyType]} on slot ${slot}`,
                  meta: {
                    deviceId: deviceIds[keyType],
                    deviceModel: deviceModels[keyType],
                    // always defined in the case of external keys
                    hdPathTemplate: mainCtrl.accountAdder.hdPathTemplate as HD_PATH_TEMPLATE_TYPE,
                    index
                  }
                })
              )

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

      port.onDisconnect.addListener(() => {
        delete portMessageUIRefs[pm.id]
        setPortfolioFetchInterval()

        if (port.name === 'tab' || port.name === 'notification') {
          ledgerCtrl.cleanUp()
          trezorCtrl.cleanUp()
        }
      })

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

// Open the get-started screen in a new tab right after the extension is installed.
browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    setTimeout(() => {
      const extensionURL = browser.runtime.getURL('tab.html')
      browser.tabs.create({ url: extensionURL })
    }, 500)
  }
})

// Send a browser notification when the signing process of a message or account op is finalized
const notifyForSuccessfulBroadcast = (type: 'message' | 'typed-data' | 'account-op') => {
  const title = 'Successfully signed'
  let message = ''
  if (type === 'message') {
    message = 'Message was successfully signed'
  }
  if (type === 'typed-data') {
    message = 'TypedData was successfully signed'
  }
  if (type === 'account-op') {
    message = 'Your transaction was successfully signed and broadcasted to the network'
  }

  const id = new Date().getTime()
  browser.notifications.create(id.toString(), {
    type: 'basic',
    iconUrl: browser.runtime.getURL('assets/images/xicon@96.png'),
    title,
    message,
    priority: 2
  })
}
