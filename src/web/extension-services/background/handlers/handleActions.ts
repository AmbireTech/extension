import { MainController } from '@ambire-common/controllers/main/main'
import { Dapp } from '@ambire-common/interfaces/dapp'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { KeyIterator } from '@ambire-common/libs/keyIterator/keyIterator'
import wait from '@ambire-common/utils/wait'
import LedgerKeyIterator from '@common/modules/hardware-wallet/libs/ledgerKeyIterator'
import TrezorKeyIterator from '@common/modules/hardware-wallet/libs/trezorKeyIterator'
import QrKeyIterator from '@common/modules/hardware-wallets/libs/qrKeyIterator/qrKeyIterator'
import { storage } from '@common/services/storage'
import { Action, MethodAction } from '@common/types/actions'
import { browser } from '@web/constants/browserapi'
import { openSidePanel } from '@web/extension-services/background/webapi/sidePanel'
import { MessageMeta, Port, PortMessenger } from '@web/extension-services/messengers'
import LatticeKeyIterator from '@web/modules/hardware-wallet/libs/latticeKeyIterator'

import sessionStorage from '../webapi/sessionStorage'
import {
  dispatchDappTabFocusFromMainCtrl,
  getDappTabTargetsFromDappId,
  getDappTabTargetsFromDappIds
} from './dispatchDappTabFocus'

export const handleActions = async (
  action: MethodAction | Action,
  {
    eventEmitterRegistry,
    mainCtrl,
    pm,
    port,
    meta
  }: {
    eventEmitterRegistry: IEventEmitterRegistryController
    mainCtrl: MainController
    pm?: PortMessenger
    port?: Port
    meta?: MessageMeta
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
        await ctrl[method](...args)
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
    case 'SET_VIEW_FOCUS': {
      if (!port) return
      mainCtrl.ui.emitViewFocus(port.id)
      break
    }
    case 'GET_ALL_CONTROLLER_NAMES': {
      if (!pm || !port) return
      pm.sendToPort(port, '> ui', {
        method: 'allControllerNames',
        params: { names: eventEmitterRegistry.values().map((c) => c.name) }
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
    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_QR_WALLET': {
      return await mainCtrl.handleAccountPickerInitQr(QrKeyIterator, params.payload)
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

      for (const account of accounts) {
        if (account.newlyAdded) {
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
      const tabTargets = getDappTabTargetsFromDappId(mainCtrl, params.id, params.source)

      if (params.source) {
        await mainCtrl.dapps.disconnectDappSource(params.id, params.source)
      } else {
        await mainCtrl.dapps.broadcastDappSessionEvent('disconnect', undefined, params.id)
        mainCtrl.dapps.updateDapp(params.id, {
          connectedSources: [],
          isConnected: false
        })
      }

      const stillConnected = mainCtrl.dapps.hasPermission(params.id)
      if (!stillConnected) {
        await mainCtrl.autoLogin.revokeAllPoliciesForDomain(params.id, params.url)
      }

      dispatchDappTabFocusFromMainCtrl(mainCtrl, tabTargets)

      break
    }
    case 'DAPPS_CONTROLLER_DISCONNECT_ALL_DAPPS': {
      const dappIdsToDisconnect = (mainCtrl.dapps.dapps as Dapp[])
        .filter((dapp) => {
          if (!dapp.isConnected) return false
          if (!params.source) return true

          return dapp.connectedSources?.includes(params.source)
        })
        .map((dapp) => dapp.id)
      const tabTargets = getDappTabTargetsFromDappIds(mainCtrl, dappIdsToDisconnect, params.source)

      const disconnectedDapps = await mainCtrl.dapps.disconnectAllDapps(params.source)

      // Process sequentially: each disconnect may call `revokeAllPoliciesForDomain`, which
      // is guarded by a status lock that throws if a previous call hasn't finished yet.
      for (const dapp of disconnectedDapps) {
        const stillConnected = mainCtrl.dapps.hasPermission(dapp.id)
        if (!stillConnected) {
          await mainCtrl.autoLogin.revokeAllPoliciesForDomain(dapp.id, dapp.url)
        }
      }

      dispatchDappTabFocusFromMainCtrl(mainCtrl, tabTargets)

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

      const isSidePanelModeEnabled = await storage.get('isSidePanelModeEnabled', false)
      const overlayPortName = isSidePanelModeEnabled ? 'side-panel' : 'popup'
      const targetWindowId = meta?.windowId ?? port?.sender?.tab?.windowId

      const getOverlayPort = () => pm!.ports.find((p) => p.name === overlayPortName)

      const focusOverlay = async () => {
        if (isSidePanelModeEnabled) {
          await openSidePanel(targetWindowId)
          return
        }

        await browser.action.openPopup()
      }

      const navigateOverlayToDashboard = async () => {
        const overlayPort = getOverlayPort()
        if (!overlayPort) return

        pm!.sendToPort(overlayPort, '> ui', { method: 'navigate', params: { route: '/' } })
        await mainCtrl.onPopupOpen(overlayPort.id)
      }

      async function waitForOverlayOpen(timeout = 10000, interval = 100) {
        const startTime = Date.now()
        while (!getOverlayPort()) {
          if (Date.now() - startTime > timeout) break
          await wait(interval)
        }
      }

      try {
        const isLoading = await sessionStorage.get('isOpenExtensionPopupLoading', false)
        if (isLoading) return

        const overlayPort = getOverlayPort()
        if (overlayPort && isSidePanelModeEnabled) {
          await focusOverlay()
          await navigateOverlayToDashboard()
          return
        }

        if (overlayPort) return

        await sessionStorage.set('isOpenExtensionPopupLoading', true)
        await focusOverlay()
        await waitForOverlayOpen()
      } catch (error) {
        try {
          await focusOverlay()
          await waitForOverlayOpen()
        } catch (e) {
          pm.send('> ui', { method: 'navigate', params: { route: '/' } })
        }
      }
      await sessionStorage.set('isOpenExtensionPopupLoading', false)
      break
    }

    case 'DISPATCH_DAPP_TAB_FOCUS': {
      dispatchDappTabFocusFromMainCtrl(mainCtrl, params.targets, params.delayMs)
      break
    }

    default:
      return console.error(
        `Dispatched ${type} action, but handler in the extension background process not found!`
      )
  }
}
