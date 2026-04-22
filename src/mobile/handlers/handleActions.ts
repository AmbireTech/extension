/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/return-await */
import { getSessionId } from '@ambire-common/classes/session'
import { MainController } from '@ambire-common/controllers/main/main'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { getDappIdFromUrl } from '@ambire-common/libs/dapps/helpers'
import { KeyIterator } from '@ambire-common/libs/keyIterator/keyIterator'
import handleProviderRequests from '@common/modules/provider/handleProviderRequests'
import { Action, MethodAction } from '@common/types/actions'
import { mobileMessenger } from '@mobile/modules/webview/services/mobileMessenger'

export const handleActions = async (
  action: MethodAction | Action,
  {
    eventEmitterRegistry,
    mainCtrl,
    sendToReactEvent
  }: {
    eventEmitterRegistry: IEventEmitterRegistryController
    mainCtrl: MainController
    sendToReactEvent: (type: string, payload: any) => void
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

    case 'INIT_CONTROLLER_STATE': {
      const ctrl = eventEmitterRegistry.values().find((c) => c.name === params.controller)

      sendToReactEvent('ctrl.update', {
        ctrlName: params.controller,
        state: ctrl?.toJSON() || null
      })

      break
    }

    case 'INIT_ALL_CONTROLLERS': {
      params.controllers.forEach((ctrlName: string) => {
        const ctrl = eventEmitterRegistry.values().find((c) => c.name === ctrlName)

        sendToReactEvent('ctrl.update', { ctrlName, state: ctrl?.toJSON() || null })
      })
      break
    }

    case 'UPDATE_UI_VIEW_ROUTE': {
      mainCtrl.ui.updateView(params.id, {
        currentRoute: params.route,
        searchParams: params.searchParams
      })
      break
    }
    case 'WINDOW_REMOVED': {
      mainCtrl.ui.window.event.emit('windowRemoved', params.id)
      break
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

    case 'WEBVIEW_ORIGIN_CHANGED': {
      try {
        const oldDappId = getDappIdFromUrl(new URL(params.previousOrigin).origin)
        const oldSessionId = getSessionId({ tabId: 1, windowId: undefined, dappId: oldDappId })
        if (mainCtrl.dapps.dappSessions[oldSessionId]) {
          mainCtrl.dapps.deleteDappSession(oldSessionId)
          console.log('[Worker] Deleted stale session for origin change:', oldDappId)
        }
      } catch {
        // Ignore invalid URLs
      }
      break
    }

    case 'HANDLE_PROVIDER_REQUEST': {
      console.log('[Worker] Handling provider request:', params.request.method, params.requestId)
      const autoLockCtrl = eventEmitterRegistry
        .values()
        .find((c: any) => c.name === 'AutoLockController') as any
      const walletStateCtrl = eventEmitterRegistry
        .values()
        .find((c: any) => c.name === 'WalletStateController') as any
      const notificationManager = mainCtrl.ui.notification

      try {
        const session = await mainCtrl.dapps.getOrCreateDappSession({
          url: params.request.origin,
          tabId: 1 // Mobile uses a single view for the dApp
        })
        mainCtrl.dapps.setSessionMessenger(session.sessionId, mobileMessenger, false)
        console.log('[Worker] Resolved session for:', session.origin, session.sessionId)

        const result = await handleProviderRequests({
          request: { ...params.request, session },
          mainCtrl,
          walletStateCtrl,
          autoLockCtrl,
          requestId: params.requestId,
          providerId: params.providerId,
          notificationManager
        })
        console.log('[Worker] handleProviderRequests result:', result)
        sendToReactEvent('action.sendToDappWebView', {
          result,
          error: null,
          requestId: params.requestId,
          providerId: params.providerId,
          topic: params.topic
        })
      } catch (error: any) {
        let errorRes
        try {
          errorRes = error.serialize()
        } catch (e) {
          errorRes = error
        }
        sendToReactEvent('action.sendToDappWebView', {
          result: null,
          error: errorRes,
          requestId: params.requestId,
          providerId: params.providerId,
          topic: params.topic
        })
      }
      break
    }

    default:
      // eslint-disable-next-line no-console
      return console.error(
        `Dispatched ${type} action, but handler in the extension background process not found!`
      )
  }
}
