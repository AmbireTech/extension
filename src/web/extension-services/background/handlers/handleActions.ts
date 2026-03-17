/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/return-await */
import { MainController } from '@ambire-common/controllers/main/main'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { KeyIterator } from '@ambire-common/libs/keyIterator/keyIterator'
import wait from '@ambire-common/utils/wait'
import { Action, MethodAction } from '@common/types/actions'
import { browser } from '@web/constants/browserapi'
import { Port, PortMessenger } from '@web/extension-services/messengers'
import LatticeKeyIterator from '@web/modules/hardware-wallet/libs/latticeKeyIterator'
import LedgerKeyIterator from '@web/modules/hardware-wallet/libs/ledgerKeyIterator'
import TrezorKeyIterator from '@web/modules/hardware-wallet/libs/trezorKeyIterator'

import sessionStorage from '../webapi/sessionStorage'

export const handleActions = async (
  action: MethodAction | Action,
  {
    eventEmitterRegistry,
    mainCtrl,
    pm,
    port
  }: {
    eventEmitterRegistry: IEventEmitterRegistryController
    mainCtrl: MainController
    pm?: PortMessenger
    port?: Port
  }
) => {
  // @ts-ignore
  const { type, params } = action
  switch (type) {
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
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER': {
      return await mainCtrl.handleAccountPickerInitLedger(LedgerKeyIterator)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_TREZOR': {
      return await mainCtrl.handleAccountPickerInitTrezor(TrezorKeyIterator)
    }
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LATTICE': {
      return await mainCtrl.handleAccountPickerInitLattice(LatticeKeyIterator)
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
      mainCtrl.signMessage.setSigners(params.signers)
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

    default:
      // eslint-disable-next-line no-console
      return console.error(
        `Dispatched ${type} action, but handler in the extension background process not found!`
      )
  }
}
