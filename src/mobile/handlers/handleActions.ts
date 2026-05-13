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
import { createWcBridgeMessenger } from '@mobile/modules/webview/services/wcBridgeMessenger'

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
      // If params.id looks like a WC topic (contains colon), find session by topic
      const isWcTopic = params.id.includes(':')
      let dappId = params.id
      let url = params.url

      if (isWcTopic) {
        const session = mainCtrl.dapps.getDappSessionByWcTopic(params.id)
        if (session) {
          dappId = session.id
          url = session.origin
        }
      } else {
        // Given a dapp ID - also check for any WC sessions with this dapp and disconnect them
        const wcSessions = Object.values(mainCtrl.dapps.dappSessions).filter(
          (s) => s.id === params.id && s.wcTopic
        )
        for (const session of wcSessions) {
          if (session.wcTopic) {
            // Send action back to RN to disconnect WC session
            sendToReactEvent('action.disconnectWcSession', {
              topic: session.wcTopic
            })
            // Delete the dapp session for this WC session
            mainCtrl.dapps.deleteDappSession(session.sessionId)
          }
        }
      }
      await mainCtrl.dapps.broadcastDappSessionEvent('disconnect', undefined, dappId)
      mainCtrl.dapps.updateDapp(dappId, { isConnected: false })
      if (isWcTopic) {
        mainCtrl.dapps.deleteDappSessionByWcTopic(params.id)
      }
      await mainCtrl.autoLogin.revokeAllPoliciesForDomain(dappId, url)

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

    /**
     * HANDLE_PROVIDER_REQUEST - Unified handler for both webview and WalletConnect requests
     *
     * This handler processes provider requests (eth_accounts, wallet_getCapabilities, etc.) from
     * both in-app webview dapps and WalletConnect dapps using the SAME communication logic.
     */
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
        // Create or retrieve dapp session using origin from request
        // For WalletConnect, origin is the proposer URL from session metadata
        // For webview, origin is the current page URL
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

        if (params.topic && params.topic.toString().includes('wc_session_request')) {
          sendToReactEvent('action.respondToWalletConnectRequest', {
            topic: params.topic.replace('wc_session_request_', ''),
            response: { result }, // Raw result - will be formatted into JSON-RPC by walletConnectService
            id: params.requestId
          })
        } else if (params.topic && params.topic.toString().includes('wc_session_proposal')) {
          // WalletConnect session proposals - approve if eth_requestAccounts succeeded
          if (result && Array.isArray(result) && result.length > 0) {
            sendToReactEvent('action.approveWalletConnectSession', {
              proposalId: params.requestId,
              accounts: result
            })
          }
        } else {
          // In-app webview requests - send to webview bridge (existing flow)
          sendToReactEvent('action.sendToDappWebView', {
            result,
            error: null,
            requestId: params.requestId,
            providerId: params.providerId,
            topic: params.topic
          })
        }
      } catch (error: any) {
        // Error handling - serialize error if possible, otherwise use raw error
        let errorRes
        try {
          errorRes = error.serialize()
        } catch (e) {
          errorRes = error
        }

        // Route error response based on request source (same logic as success case)
        if (params.topic && params.topic.toString().includes('wc_session_request')) {
          sendToReactEvent('action.respondToWalletConnectRequest', {
            topic: params.topic.replace('wc_session_request_', ''),
            response: { error: errorRes }, // Raw error - will be formatted into JSON-RPC by walletConnectService
            id: params.requestId
          })
        } else if (params.topic && params.topic.toString().includes('wc_session_proposal')) {
          sendToReactEvent('action.rejectWalletConnectSession', {
            proposalId: params.requestId
          })
        } else {
          sendToReactEvent('action.sendToDappWebView', {
            result: null,
            error: errorRes,
            requestId: params.requestId,
            providerId: params.providerId,
            topic: params.topic
          })
        }
      }
      break
    }

    case 'SETUP_WC_SESSION_MESSENGER': {
      const session = await mainCtrl.dapps.getOrCreateDappSession({
        url: params.url,
        tabId: params.tabId,
        wcTopic: params.wcSessionTopic
      })
      const messenger = createWcBridgeMessenger(params.wcSessionTopic, params.chainId)
      mainCtrl.dapps.setSessionMessenger(session.sessionId, messenger, false)
      break
    }

    case 'RESTORE_WC_SESSIONS': {
      // Track which dapp IDs we've already restored to avoid duplicates
      const restoredDappIds = new Set<string>()
      // Restore dapp sessions and messengers for persisted WalletConnect sessions
      for (const wcSession of params.sessions) {
        try {
          const dappId = getDappIdFromUrl(new URL(wcSession.url).origin)
          if (restoredDappIds.has(dappId)) {
            continue
          }
          restoredDappIds.add(dappId)
          // Use a unique tabId for WalletConnect sessions to avoid conflict with in-app dapp sessions
          // The in-app WebView uses tabId: 1, so we use a hash of the topic to ensure uniqueness
          const wcTabId =
            1000000 +
            (wcSession.topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 900000)
          const session = await mainCtrl.dapps.getOrCreateDappSession({
            url: wcSession.url,
            tabId: wcTabId,
            wcTopic: wcSession.topic
          })
          const messenger = createWcBridgeMessenger(wcSession.topic, wcSession.chainId)
          mainCtrl.dapps.setSessionMessenger(session.sessionId, messenger, false)
        } catch (e) {
          console.error('[Worker] Failed to restore WC session for topic:', wcSession.topic, e)
        }
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
