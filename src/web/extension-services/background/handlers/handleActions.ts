/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/return-await */
import { BIP44_STANDARD_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { MainController } from '@ambire-common/controllers/main/main'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { SwapAndBridgeRequest } from '@ambire-common/interfaces/userRequest'
import { KeyIterator } from '@ambire-common/libs/keyIterator/keyIterator'
import wait from '@ambire-common/utils/wait'
import { browser } from '@web/constants/browserapi'
import { Action } from '@web/extension-services/background/actions'
import AutoLockController from '@web/extension-services/background/controllers/auto-lock'
import { ExtensionUpdateController } from '@web/extension-services/background/controllers/extension-update'
import { WalletStateController } from '@web/extension-services/background/controllers/wallet-state'
import { Port, PortMessenger } from '@web/extension-services/messengers'
import LatticeKeyIterator from '@web/modules/hardware-wallet/libs/latticeKeyIterator'
import LedgerKeyIterator from '@web/modules/hardware-wallet/libs/ledgerKeyIterator'
import TrezorKeyIterator from '@web/modules/hardware-wallet/libs/trezorKeyIterator'

import sessionStorage from '../webapi/sessionStorage'

export const handleActions = async (
  action: Action,
  {
    pm,
    port,
    eventEmitterRegistry,
    mainCtrl,
    walletStateCtrl,
    autoLockCtrl,
    extensionUpdateCtrl,
    windowId
  }: {
    pm: PortMessenger
    port: Port
    eventEmitterRegistry: IEventEmitterRegistryController
    mainCtrl: MainController
    walletStateCtrl: WalletStateController
    autoLockCtrl: AutoLockController
    extensionUpdateCtrl: ExtensionUpdateController
    windowId?: number
  }
) => {
  // @ts-ignore
  const { type, params } = action
  switch (type) {
    case 'UPDATE_PORT_URL': {
      if (port.sender) {
        port.sender.url = params.url
        if (port.sender.tab) port.sender.tab.url = params.url
      }
      mainCtrl.ui.updateView(port.id, {
        currentRoute: params.route,
        searchParams: params.searchParams
      })
      break
    }
    case 'INIT_CONTROLLER_STATE': {
      const ctrl = eventEmitterRegistry.values().find((c) => c.name === params.controller)
      if (ctrl) pm.send('> ui', { method: params.controller, params: ctrl })

      break
    }
    case 'MAIN_CONTROLLER_LOCK':
      return mainCtrl.lock()
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER': {
      return await mainCtrl.handleAccountPickerInitLedger(LedgerKeyIterator)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_TREZOR': {
      return await mainCtrl.handleAccountPickerInitTrezor(TrezorKeyIterator)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LATTICE': {
      return await mainCtrl.handleAccountPickerInitLattice(LatticeKeyIterator)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_PRIVATE_KEY_OR_SEED_PHRASE': {
      const hdPathTemplate = BIP44_STANDARD_DERIVATION_TEMPLATE
      const keyIterator = new KeyIterator(params.privKeyOrSeed, params.seedPassphrase)
      await mainCtrl.accountPicker.setInitParams({ keyIterator, hdPathTemplate })
      break
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_FROM_SAVED_SEED_PHRASE': {
      const keystoreSavedSeed = await mainCtrl.keystore.getSavedSeed(params.id)
      if (!keystoreSavedSeed) return

      const keyIterator = new KeyIterator(keystoreSavedSeed.seed, keystoreSavedSeed.seedPassphrase)
      await mainCtrl.accountPicker.setInitParams({
        keyIterator,
        hdPathTemplate: keystoreSavedSeed.hdPathTemplate
      })
      break
    }
    case 'PROVIDERS_CONTROLLER_TOGGLE_BATCHING': {
      return await mainCtrl.providers.toggleBatching()
    }
    case 'MAIN_CONTROLLER_ADD_NETWORK': {
      return await mainCtrl.addNetwork(params)
    }
    case 'ACCOUNTS_CONTROLLER_UPDATE_ACCOUNT_PREFERENCES': {
      return await mainCtrl.accounts.updateAccountPreferences(params)
    }
    case 'ACCOUNTS_CONTROLLER_REORDER_ACCOUNTS': {
      return await mainCtrl.accounts.reorderAccounts(params)
    }
    case 'ACCOUNTS_CONTROLLER_UPDATE_ACCOUNT_STATE': {
      return await mainCtrl.accounts.updateAccountState(params.addr, 'latest', params.chainIds)
    }
    case 'ACCOUNTS_CONTROLLER_RESET_ACCOUNTS_NEWLY_ADDED_STATE': {
      return await mainCtrl.accounts.resetAccountsNewlyAddedState()
    }
    case 'SETTINGS_CONTROLLER_SET_NETWORK_TO_ADD_OR_UPDATE': {
      return await mainCtrl.networks.setNetworkToAddOrUpdate(params)
    }
    case 'SETTINGS_CONTROLLER_RESET_NETWORK_TO_ADD_OR_UPDATE': {
      return await mainCtrl.networks.setNetworkToAddOrUpdate(null)
    }
    case 'KEYSTORE_CONTROLLER_UPDATE_KEY_PREFERENCES': {
      return await mainCtrl.keystore.updateKeyPreferences(params)
    }
    case 'MAIN_CONTROLLER_UPDATE_NETWORK': {
      return await mainCtrl.networks.updateNetwork(params.network, params.chainId)
    }
    case 'MAIN_CONTROLLER_UPDATE_NETWORKS': {
      return await mainCtrl.networks.updateNetworks(params.network, params.chainIds)
    }
    case 'MAIN_CONTROLLER_SELECT_ACCOUNT': {
      return await mainCtrl.selectAccount(params.accountAddr)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_SELECT_ACCOUNT': {
      return mainCtrl.accountPicker.selectAccount(params.account)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_DESELECT_ACCOUNT': {
      return mainCtrl.accountPicker.deselectAccount(params.account)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_RESET': {
      await mainCtrl.accountPicker.reset()
      break
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT': {
      mainCtrl.accountPicker.init()
      break
    }
    case 'RESET_ACCOUNT_ADDING_ON_PAGE_ERROR': {
      await mainCtrl.accountPicker.reset()
      const accounts = [...mainCtrl.accounts.accounts]
      // eslint-disable-next-line no-restricted-syntax
      for (const account of accounts) {
        if (account.newlyAdded) {
          // eslint-disable-next-line no-await-in-loop
          await mainCtrl.removeAccount(account.addr)
        }
      }

      break
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_RESET_ACCOUNTS_SELECTION': {
      mainCtrl.accountPicker.resetAccountsSelection()
      break
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_SET_PAGE':
      return await mainCtrl.accountPicker.setPage(params)
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_FIND_AND_SET_LINKED_ACCOUNTS': {
      return await mainCtrl.accountPicker.findAndSetLinkedAccounts()
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_SET_HD_PATH_TEMPLATE': {
      return await mainCtrl.accountPicker.setHDPathTemplate(params)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_ADD_ACCOUNTS': {
      await mainCtrl.accountPicker.addAccounts()
      break
    }
    case 'IMPORT_SMART_ACCOUNT_JSON': {
      // Add accounts first, because some of the next steps have validation
      // if accounts exists.
      await mainCtrl.accounts.addAccounts([params.readyToAddAccount])

      // Then add keys, because some of the next steps could have validation
      // if keys exists. Should be separate (not combined in Promise.all,
      // since firing multiple keystore actions is not possible
      // (the #wrapKeystoreAction listens for the first one to finish and
      // skips the parallel one, if one is requested).

      return await mainCtrl.keystore.addKeys(params.keys)
    }
    case 'KEYSTORE_CONTROLLER_SEND_PASSWORD_DECRYPTED_PRIVATE_KEY_TO_UI': {
      return await mainCtrl.keystore.sendPasswordDecryptedPrivateKeyToUi(
        params.secret,
        params.key,
        params.salt,
        params.iv,
        params.associatedKeys
      )
    }
    case 'MAIN_CONTROLLER_ADD_VIEW_ONLY_ACCOUNTS': {
      // Since these accounts are view-only, directly add them in the
      // MainController, bypassing the AccountPicker flow.
      await mainCtrl.accounts.addAccounts(params.accounts)
      break
    }
    case 'MAIN_CONTROLLER_REMOVE_ACCOUNT': {
      return await mainCtrl.removeAccount(params.accountAddr)
    }
    case 'MAIN_CONTROLLER_SIGN_MESSAGE_INIT': {
      return await mainCtrl.signMessage.init(params)
    }
    case 'MAIN_CONTROLLER_SIGN_MESSAGE_RESET':
      return mainCtrl.signMessage.reset()
    case 'MAIN_CONTROLLER_SIGN_MESSAGE_UPDATE': {
      return mainCtrl.signMessage.update(params)
    }
    case 'MAIN_CONTROLLER_HANDLE_SIGN_MESSAGE': {
      mainCtrl.signMessage.setSigningKey(params.keyAddr, params.keyType)
      return await mainCtrl.handleSignMessage()
    }
    case 'MAIN_CONTROLLER_ACTIVITY_SET_ACC_OPS_FILTERS':
      return mainCtrl.activity.filterAccountsOps(
        params.sessionId,
        params.filters,
        params.pagination
      )
    case 'MAIN_CONTROLLER_ACTIVITY_SET_SIGNED_MESSAGES_FILTERS':
      return mainCtrl.activity.filterSignedMessages(
        params.sessionId,
        params.filters,
        params.pagination
      )
    case 'MAIN_CONTROLLER_ACTIVITY_RESET_ACC_OPS_FILTERS':
      return mainCtrl.activity.resetAccountsOpsFilters(params.sessionId)
    case 'MAIN_CONTROLLER_ACTIVITY_RESET_SIGNED_MESSAGES_FILTERS':
      return mainCtrl.activity.resetSignedMessagesFilters(params.sessionId)

    case 'MAIN_CONTROLLER_HANDLE_SIGN_AND_BROADCAST_ACCOUNT_OP': {
      return await mainCtrl.handleSignAndBroadcastAccountOp(params.type, params.fromRequestId)
    }

    case 'REQUESTS_CONTROLLER_BUILD_REQUEST':
      return await mainCtrl.requests.build(params)
    case 'REQUESTS_CONTROLLER_ADD_CALLS_USER_REQUEST': {
      return await mainCtrl.requests.build({ type: 'calls', params })
    }
    case 'REQUESTS_CONTROLLER_REMOVE_USER_REQUEST':
      return mainCtrl.requests.removeUserRequests([params.id])
    case 'REQUESTS_CONTROLLER_RESOLVE_USER_REQUEST':
      return mainCtrl.requests.resolveUserRequest(params.data, params.id)
    case 'REQUESTS_CONTROLLER_REJECT_USER_REQUEST':
      return mainCtrl.requests.rejectUserRequests(params.err, [params.id], params.options)
    case 'REQUESTS_CONTROLLER_REJECT_CALL_FROM_USER_REQUEST': {
      await mainCtrl.requests.rejectCalls({ callIds: [params.callId] })
      break
    }

    case 'CURRENT_SIGN_ACCOUNT_OP_UPDATE': {
      if (
        params.updateType === 'Requests' &&
        mainCtrl.requests.currentUserRequest?.kind === 'calls'
      ) {
        return mainCtrl.requests.currentUserRequest.signAccountOp.update(params)
      }
      if (params.updateType === 'Swap&Bridge') {
        return mainCtrl?.swapAndBridge?.signAccountOpController?.update(params)
      }

      // 'Transfer&TopUp'
      return mainCtrl?.transfer?.signAccountOpController?.update(params)
    }
    case 'CURRENT_SIGN_ACCOUNT_OP_UPDATE_STATUS': {
      if (
        params.updateType === 'Requests' &&
        mainCtrl.requests.currentUserRequest?.kind === 'calls'
      ) {
        return mainCtrl?.requests?.currentUserRequest?.signAccountOp.updateStatus(params.status)
      }
      if (params.updateType === 'Swap&Bridge') {
        return mainCtrl?.swapAndBridge?.signAccountOpController?.updateStatus(params.status)
      }

      // 'Transfer&TopUp'
      return mainCtrl?.transfer?.signAccountOpController?.updateStatus(params.status)
    }
    case 'CURRENT_SIGN_ACCOUNT_OP_REESTIMATE': {
      if (params.type === 'default' && mainCtrl.requests.currentUserRequest?.kind === 'calls') {
        return mainCtrl.requests.currentUserRequest.signAccountOp.retry('simulate')
      }
      if (params.type === 'one-click-swap-and-bridge') {
        return mainCtrl?.swapAndBridge?.signAccountOpController?.retry('estimate')
      }

      // transfer
      return mainCtrl?.transfer?.signAccountOpController?.retry('estimate')
    }

    case 'SELECTED_ACCOUNT_SET_DASHBOARD_NETWORK_FILTER': {
      mainCtrl.selectedAccount.setDashboardNetworkFilter(params.dashboardNetworkFilter)
      break
    }

    case 'DISMISS_DEFI_POSITIONS_BANNER': {
      await mainCtrl.selectedAccount.dismissDefiPositionsBannerForTheSelectedAccount()
      break
    }

    case 'SWAP_AND_BRIDGE_CONTROLLER_INIT_FORM':
      return await mainCtrl.swapAndBridge.initForm(params.sessionId, {
        preselectedFromToken: params.preselectedFromToken,
        preselectedToToken: params.preselectedToToken ?? undefined,
        fromAmount: params.fromAmount ?? undefined,
        activeRouteIdToDelete: params.activeRouteIdToDelete ?? undefined
      })
    case 'SWAP_AND_BRIDGE_CONTROLLER_UNLOAD_SCREEN':
      return mainCtrl.swapAndBridge.unloadScreen(params.sessionId, params.forceUnload)
    case 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM':
      return mainCtrl.swapAndBridge.updateForm(params.formValues, params.updateProps)
    case 'SWAP_AND_BRIDGE_CONTROLLER_SWITCH_FROM_AND_TO_TOKENS':
      return await mainCtrl.swapAndBridge.switchFromAndToTokens()
    case 'SWAP_AND_BRIDGE_CONTROLLER_ADD_TO_TOKEN_BY_ADDRESS':
      return await mainCtrl.swapAndBridge.addToTokenByAddress(params.address)
    case 'SWAP_AND_BRIDGE_CONTROLLER_SEARCH_TO_TOKEN':
      return await mainCtrl.swapAndBridge.searchToToken(params.searchTerm)
    case 'SWAP_AND_BRIDGE_CONTROLLER_SELECT_ROUTE':
      return await mainCtrl.swapAndBridge.selectRoute(params.route, {
        isManualSelection: true
      })
    case 'REQUESTS_CONTROLLER_SWAP_AND_BRIDGE_ACTIVE_ROUTE_BUILD_NEXT_USER_REQUEST':
      return await mainCtrl.requests.build({
        type: 'swapAndBridgeRequest',
        params: {
          openActionWindow: true,
          activeRouteId: params.activeRouteId,
          windowId
        }
      })
    case 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_QUOTE': {
      await mainCtrl.swapAndBridge.updateQuote({
        skipPreviousQuoteRemoval: true,
        skipQuoteUpdateOnSameValues: false,
        skipStatusUpdate: false
      })
      break
    }
    case 'SWAP_AND_BRIDGE_CONTROLLER_RESET_FORM':
      return mainCtrl.swapAndBridge.resetForm()
    case 'SWAP_AND_BRIDGE_CONTROLLER_MARK_SELECTED_ROUTE_AS_FAILED':
      return mainCtrl.swapAndBridge.markSelectedRouteAsFailed(params.disabledReason)
    case 'SWAP_AND_BRIDGE_CONTROLLER_HAS_USER_PROCEEDED':
      return mainCtrl?.swapAndBridge.setUserProceeded(params.proceeded)
    case 'SWAP_AND_BRIDGE_CONTROLLER_DESTROY_SIGN_ACCOUNT_OP':
      return mainCtrl?.swapAndBridge.destroySignAccountOp()
    case 'OPEN_SIGNING_REQUEST_WINDOW': {
      if (!mainCtrl.selectedAccount.account) throw new Error('No selected account')

      const idSuffix = params.type === 'swapAndBridge' ? 'swap-and-bridge-sign' : 'transfer-sign'

      return mainCtrl.requests.addUserRequests(
        [
          {
            id: `${mainCtrl.selectedAccount.account.addr}-${idSuffix}`,
            kind: params.type,
            meta: {
              accountAddr: mainCtrl.selectedAccount.account.addr
            },
            dappPromises: []
          } as SwapAndBridgeRequest
        ],
        {
          position: 'last',
          executionType: 'open-request-window'
        }
      )
    }
    case 'CLOSE_SIGNING_REQUEST_WINDOW': {
      if (!mainCtrl.selectedAccount.account) throw new Error('No selected account')

      const idSuffix = params.type === 'swapAndBridge' ? 'swap-and-bridge-sign' : 'transfer-sign'

      return mainCtrl.requests.removeUserRequests([
        `${mainCtrl.selectedAccount.account.addr}-${idSuffix}`
      ])
    }
    case 'TRANSFER_CONTROLLER_UPDATE_FORM':
      return mainCtrl.transfer.update(params.formValues)
    case 'TRANSFER_CONTROLLER_RESET_FORM':
      return mainCtrl.transfer.resetForm()
    case 'TRANSFER_CONTROLLER_DESTROY_LATEST_BROADCASTED_ACCOUNT_OP':
      return mainCtrl.transfer.destroyLatestBroadcastedAccountOp()
    case 'TRANSFER_CONTROLLER_HAS_USER_PROCEEDED':
      return mainCtrl.transfer.setUserProceeded(params.proceeded)
    case 'TRANSFER_CONTROLLER_SHOULD_SKIP_TRANSACTION_QUEUED_MODAL':
      mainCtrl.transfer.shouldSkipTransactionQueuedModal = params.shouldSkip
      return
    case 'MAIN_CONTROLLER_REMOVE_ACTIVE_ROUTE':
      return mainCtrl.removeActiveRoute(params.activeRouteId)

    case 'REQUESTS_CONTROLLER_FOCUS_REQUEST_WINDOW':
      return mainCtrl.requests.focusRequestWindow()
    case 'REQUESTS_CONTROLLER_SET_CURRENT_REQUEST_BY_ID':
      return mainCtrl.requests.setCurrentUserRequestById(params.requestId, {
        baseWindowId: windowId
      })
    case 'REQUESTS_CONTROLLER_SET_CURRENT_REQUEST_BY_INDEX':
      return mainCtrl.requests.setCurrentUserRequestByIndex(params.index, {
        ...params.params,
        baseWindowId: windowId
      })
    case 'REQUESTS_CONTROLLER_SET_WINDOW_LOADED':
      return mainCtrl.requests.setWindowLoaded()

    case 'MAIN_CONTROLLER_RELOAD_SELECTED_ACCOUNT': {
      return await mainCtrl.reloadSelectedAccount({
        chainIds: params?.chainId ? [BigInt(params?.chainId)] : undefined,
        isManualReload: true
      })
    }
    case 'MAIN_CONTROLLER_UPDATE_SELECTED_ACCOUNT_PORTFOLIO': {
      return await mainCtrl.updateSelectedAccountPortfolio(params)
    }

    case 'DEFI_CONTOLLER_ADD_SESSION': {
      mainCtrl.portfolio.addDefiSession(params.sessionId)
      break
    }
    case 'DEFI_CONTOLLER_REMOVE_SESSION': {
      mainCtrl.portfolio.removeDefiSession(params.sessionId)
      break
    }

    case 'PORTFOLIO_CONTROLLER_GET_TEMPORARY_TOKENS': {
      if (!mainCtrl.selectedAccount.account) return

      return await mainCtrl.portfolio.getTemporaryTokens(
        mainCtrl.selectedAccount.account.addr,
        params.chainId,
        params.additionalHint
      )
    }
    case 'PORTFOLIO_CONTROLLER_ADD_CUSTOM_TOKEN': {
      return await mainCtrl.portfolio.addCustomToken(
        params.token,
        mainCtrl.selectedAccount.account?.addr,
        params.shouldUpdatePortfolio
      )
    }
    case 'PORTFOLIO_CONTROLLER_REMOVE_CUSTOM_TOKEN': {
      return await mainCtrl.portfolio.removeCustomToken(
        params.token,
        mainCtrl.selectedAccount.account?.addr,
        params.shouldUpdatePortfolio
      )
    }
    case 'PORTFOLIO_CONTROLLER_TOGGLE_HIDE_TOKEN': {
      return await mainCtrl.portfolio.toggleHideToken(
        params.token,
        mainCtrl.selectedAccount.account?.addr,
        params.shouldUpdatePortfolio
      )
    }
    case 'PORTFOLIO_CONTROLLER_CHECK_TOKEN': {
      if (!mainCtrl.selectedAccount.account) return
      return await mainCtrl.portfolio.updateTokenValidationByStandard(
        params.token,
        mainCtrl.selectedAccount.account.addr,
        params.allNetworks
      )
    }
    case 'KEYSTORE_CONTROLLER_ADD_SECRET':
      return await mainCtrl.keystore.addSecret(
        params.secretId,
        params.secret,
        params.extraEntropy,
        params.leaveUnlocked
      )
    case 'KEYSTORE_CONTROLLER_ADD_TEMP_SEED':
      return await mainCtrl.keystore.addTempSeed(params)
    case 'KEYSTORE_CONTROLLER_GENERATE_TEMP_SEED':
      return await mainCtrl.keystore.generateTempSeed(params)
    case 'KEYSTORE_CONTROLLER_UPDATE_SEED':
      return await mainCtrl.keystore.updateSeed(params)
    case 'KEYSTORE_CONTROLLER_UNLOCK_WITH_SECRET':
      return await mainCtrl.keystore.unlockWithSecret(params.secretId, params.secret)
    case 'KEYSTORE_CONTROLLER_RESET_ERROR_STATE':
      return mainCtrl.keystore.resetErrorState()
    case 'KEYSTORE_CONTROLLER_CHANGE_PASSWORD':
      return await mainCtrl.keystore.changeKeystorePassword(
        params.newSecret,
        params.secret,
        params.extraEntropy
      )
    case 'KEYSTORE_CONTROLLER_CHANGE_PASSWORD_FROM_RECOVERY':
      // In the case we change the user's device password through the recovery process,
      // we don't know the old password, which is why we send only the new password.
      return await mainCtrl.keystore.changeKeystorePassword(
        params.newSecret,
        undefined,
        params.extraEntropy
      )
    case 'KEYSTORE_CONTROLLER_SEND_PRIVATE_KEY_TO_UI':
      return await mainCtrl.keystore.sendPrivateKeyToUi(params.keyAddr)
    case 'KEYSTORE_CONTROLLER_SEND_ENCRYPTED_PRIVATE_KEY_TO_UI':
      return await mainCtrl.keystore.sendPasswordEncryptedPrivateKeyToUi(
        params.keyAddr,
        params.secret,
        params.entropy
      )
    case 'KEYSTORE_CONTROLLER_SEND_SEED_TO_UI':
      return await mainCtrl.keystore.sendSeedToUi(params.id)
    case 'KEYSTORE_CONTROLLER_SEND_TEMP_SEED_TO_UI':
      return await mainCtrl.keystore.sendTempSeedToUi()
    case 'KEYSTORE_CONTROLLER_DELETE_SEED':
      return await mainCtrl.keystore.deleteSeed(params.id)
    case 'KEYSTORE_CONTROLLER_SEND_DECRYPTED_MESSAGE_TO_UI':
      return await mainCtrl.keystore.sendDecryptedMessageToUi({
        encryptedMessage: params.encryptedMessage,
        keyAddr: params.keyAddr,
        keyType: params.keyType
      })

    case 'EMAIL_VAULT_CONTROLLER_GET_INFO':
      return await mainCtrl.emailVault?.getEmailVaultInfo(params.email)
    case 'EMAIL_VAULT_CONTROLLER_UPLOAD_KEYSTORE_SECRET':
      return await mainCtrl.emailVault?.uploadKeyStoreSecret(params.email)
    case 'EMAIL_VAULT_CONTROLLER_HANDLE_MAGIC_LINK_KEY':
      return await mainCtrl.emailVault?.handleMagicLinkKey(params.email, undefined, params.flow)
    case 'EMAIL_VAULT_CONTROLLER_CANCEL_CONFIRMATION':
      return mainCtrl.emailVault?.cancelEmailConfirmation()
    case 'EMAIL_VAULT_CONTROLLER_RECOVER_KEYSTORE':
      return await mainCtrl.emailVault?.recoverKeyStore(params.email, params.newPass)
    case 'EMAIL_VAULT_CONTROLLER_CLEAN_MAGIC_AND_SESSION_KEYS':
      return await mainCtrl.emailVault?.cleanMagicAndSessionKeys()
    case 'EMAIL_VAULT_CONTROLLER_REQUEST_KEYS_SYNC':
      return await mainCtrl.emailVault?.requestKeysSync(params.email, params.keys)
    case 'EMAIL_VAULT_CONTROLLER_DISMISS_BANNER':
      return mainCtrl.emailVault?.dismissBanner()
    case 'ADDRESS_BOOK_CONTROLLER_ADD_CONTACT': {
      await mainCtrl.addressBook.addContact(params.name, params.address)
      await mainCtrl.transfer.checkIsRecipientAddressUnknown()

      return
    }
    case 'ADDRESS_BOOK_CONTROLLER_RENAME_CONTACT': {
      const { address, newName } = params

      const account = mainCtrl.accounts.accounts.find(
        ({ addr }) => addr.toLowerCase() === address.toLowerCase()
      )

      if (!account) {
        await mainCtrl.addressBook.renameManuallyAddedContact(address, newName)
        return
      }

      return await mainCtrl.accounts.updateAccountPreferences([
        {
          addr: address,
          preferences: {
            pfp: account.preferences.pfp,
            label: newName
          }
        }
      ])
    }
    case 'ADDRESS_BOOK_CONTROLLER_REMOVE_CONTACT':
      return await mainCtrl.addressBook.removeManuallyAddedContact(params.address)
    case 'DOMAINS_CONTROLLER_REVERSE_LOOKUP':
      return await mainCtrl.domains.reverseLookup(params.address)
    case 'DOMAINS_CONTROLLER_SAVE_RESOLVED_REVERSE_LOOKUP':
      return mainCtrl.domains.saveResolvedReverseLookup(params)
    case 'CONTRACT_NAMES_CONTROLLER_GET_NAME':
      return mainCtrl.contractNames.getName(params.address, params.chainId)
    case 'SET_IS_PINNED': {
      walletStateCtrl.isPinned = params.isPinned
      break
    }
    case 'SET_AVATAR_TYPE': {
      walletStateCtrl.setAvatarType(params.avatarType)
      break
    }
    case 'SET_IS_SETUP_COMPLETE': {
      walletStateCtrl.isSetupComplete = params.isSetupComplete
      break
    }
    case 'AUTO_LOCK_CONTROLLER_SET_LAST_ACTIVE_TIME': {
      autoLockCtrl.setLastActiveTime()
      break
    }
    case 'AUTO_LOCK_CONTROLLER_SET_AUTO_LOCK_TIME': {
      autoLockCtrl.autoLockTime = params
      break
    }

    case 'FEATURE_FLAGS_CONTROLLER_FLIP_FEATURE': {
      return await mainCtrl.featureFlags.setFeatureFlag(params.flag, params.isEnabled)
    }

    case 'INVITE_CONTROLLER_VERIFY': {
      return await mainCtrl.invite.verify(params.code)
    }
    case 'INVITE_CONTROLLER_BECOME_OG': {
      return await mainCtrl.invite.becomeOG()
    }
    case 'INVITE_CONTROLLER_REVOKE_OG': {
      return await mainCtrl.invite.revokeOG()
    }

    case 'DAPPS_CONTROLLER_FETCH_AND_UPDATE_DAPPS': {
      await mainCtrl.dapps.fetchAndUpdateDapps()
      break
    }
    case 'DAPPS_CONTROLLER_DISCONNECT_DAPP': {
      await mainCtrl.dapps.broadcastDappSessionEvent('disconnect', undefined, params.id)
      mainCtrl.dapps.updateDapp(params.id, { isConnected: false })
      await mainCtrl.autoLogin.revokeAllPoliciesForDomain(params.id, params.url)

      break
    }
    case 'CHANGE_CURRENT_DAPP_NETWORK': {
      mainCtrl.dapps.updateDapp(params.id, { chainId: params.chainId })
      await mainCtrl.dapps.broadcastDappSessionEvent(
        'chainChanged',
        {
          chain: `0x${params.chainId.toString(16)}`,
          networkVersion: `${params.chainId}`
        },
        params.id
      )
      break
    }
    case 'DAPP_CONTROLLER_UPDATE_DAPP': {
      return mainCtrl.dapps.updateDapp(params.id, params.dapp)
    }
    case 'DAPP_CONTROLLER_REMOVE_DAPP': {
      return mainCtrl.dapps.removeDapp(params)
    }
    case 'EXTENSION_UPDATE_CONTROLLER_APPLY_UPDATE': {
      extensionUpdateCtrl.applyUpdate()
      break
    }

    case 'OPEN_EXTENSION_POPUP': {
      // eslint-disable-next-line no-inner-declarations
      async function waitForPopupOpen(timeout = 10000, interval = 100) {
        const startTime = Date.now()
        while (!pm.ports.some((p) => p.name === 'popup')) {
          if (Date.now() - startTime > timeout) break
          await wait(interval)
        }
      }

      try {
        const isLoading = await sessionStorage.get('isOpenExtensionPopupLoading', false)
        const isPopupAlreadyOpened = pm.ports.some((p) => p.name === 'popup')
        if (isLoading || isPopupAlreadyOpened) return

        await sessionStorage.set('isOpenExtensionPopupLoading', true)
        await browser.action.openPopup()
        await waitForPopupOpen()
      } catch (error) {
        try {
          await chrome.action.openPopup()
          await waitForPopupOpen()
        } catch (e) {
          pm.send('> ui', { method: 'navigate', params: { route: '/' } })
        }
      }
      await sessionStorage.set('isOpenExtensionPopupLoading', false)
      break
    }

    case 'SET_THEME_TYPE': {
      await walletStateCtrl.setThemeType(params.themeType)
      break
    }
    case 'SET_LOG_LEVEL': {
      await walletStateCtrl.setLogLevel(params.logLevel)
      break
    }
    case 'SET_CRASH_ANALYTICS': {
      await walletStateCtrl.setCrashAnalytics(params.enabled)
      break
    }

    case 'DISMISS_BANNER': {
      await mainCtrl.banner.dismissBanner(params.bannerId)
      break
    }

    default:
      // eslint-disable-next-line no-console
      return console.error(
        `Dispatched ${type} action, but handler in the extension background process not found!`
      )
  }
}
