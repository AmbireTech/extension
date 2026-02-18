/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/return-await */
import { BIP44_STANDARD_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { MainController } from '@ambire-common/controllers/main/main'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { KeyIterator } from '@ambire-common/libs/keyIterator/keyIterator'
import wait from '@ambire-common/utils/wait'
import { browser } from '@web/constants/browserapi'
import { Action } from '@web/extension-services/background/actions'
import { WalletStateController } from '@web/extension-services/background/controllers/wallet-state'
import { Port, PortMessenger } from '@web/extension-services/messengers'
import LatticeKeyIterator from '@web/modules/hardware-wallet/libs/latticeKeyIterator'
import LedgerKeyIterator from '@web/modules/hardware-wallet/libs/ledgerKeyIterator'
import TrezorKeyIterator from '@web/modules/hardware-wallet/libs/trezorKeyIterator'

import sessionStorage from '../webapi/sessionStorage'

export const handleActions = async (
  action: Action,
  {
    eventEmitterRegistry,
    mainCtrl,
    walletStateCtrl,
    pm,
    port
  }: {
    eventEmitterRegistry: IEventEmitterRegistryController
    mainCtrl: MainController
    walletStateCtrl: WalletStateController
    pm?: PortMessenger
    port?: Port
  }
) => {
  // @ts-ignore
  const { type, params } = action
  switch (type) {
    case 'HANDSHAKE': {
      if (!pm || !port) return
      pm.sendToPort(port, '> ui', { method: 'portReady', params: {} })
      break
    }
    case 'UPDATE_PORT_URL': {
      if (!port) return

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
      if (!pm) return

      const ctrl = eventEmitterRegistry.values().find((c) => c.name === params.controller)
      pm.send('> ui', { method: params.controller, params: ctrl ?? null })

      break
    }
    case 'method': {
      const { ctrlName, method, args } = params

      const ctrl = eventEmitterRegistry.values().find((c) => c.name === ctrlName) as any

      if (!ctrl) {
        console.error(`handleAction: Controller ${ctrlName} not found`)

        return
      }

      if (ctrl && typeof ctrl[method] === 'function') {
        ctrl[method](...args)
      }
      break
    }
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

    case 'MAIN_CONTROLLER_HANDLE_SIGN_MESSAGE': {
      mainCtrl.signMessage.setSigningKey(params.keyAddr, params.keyType)
      return await mainCtrl.handleSignMessage()
    }

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
    case 'DAPPS_CONTROLLER_GET_CURRENT_DAPP_AND_SEND_RES_TO_UI': {
      return mainCtrl.dapps.getCurrentDappAndSendResToUi(params)
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

    case 'OPEN_EXTENSION_POPUP': {
      if (!pm) return

      // eslint-disable-next-line no-inner-declarations
      async function waitForPopupOpen(timeout = 10000, interval = 100) {
        const startTime = Date.now()
        while (!pm!.ports.some((p) => p.name === 'popup')) {
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
