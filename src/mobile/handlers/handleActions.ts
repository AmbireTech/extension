import { getSessionId } from '@ambire-common/classes/session'
import { MainController } from '@ambire-common/controllers/main/main'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { getDappIdFromUrl } from '@ambire-common/libs/dapps/helpers'
import { KeyIterator } from '@ambire-common/libs/keyIterator/keyIterator'
import handleProviderRequests from '@common/modules/provider/handleProviderRequests'
import { Action, MethodAction } from '@common/types/actions'
import { getWcTabIdFromTopic } from '@mobile/modules/wallet-connect/utils'
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
      const { tabId, isWalletConnect, isWcAuthenticate, request, topic } = params
      // temp_wc_auth_ is reused for both account-selection (eth_requestAccounts) and
      // the subsequent personal_sign. Only treat it as a temp/handshake session for
      // the account-selection step — personal_sign must go through the signing path.
      const isTempSession =
        topic === `temp_wallet_connect_session_${tabId}` ||
        (topic === `temp_wc_auth_${tabId}` && request.method === 'eth_requestAccounts')

      try {
        const session = await mainCtrl.dapps.getOrCreateDappSession({
          url: request.origin,
          tabId,
          wcTopic: isWalletConnect ? topic : undefined
        })

        if (!isWalletConnect) {
          mainCtrl.dapps.setSessionMessenger(session.sessionId, mobileMessenger, false)
        }

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

        if (isWalletConnect) {
          if (isTempSession) {
            if (!!result) {
              if (isWcAuthenticate) {
                // Account selected — format the SIWE message and dispatch personal_sign
                sendToReactEvent('action.prepareWcAuthenticate', {
                  id: params.requestId,
                  accounts: result
                })
              } else {
                sendToReactEvent('action.approveWalletConnectSession', {
                  proposalId: params.requestId,
                  accounts: result
                })
              }
            }
          } else if (isWcAuthenticate && request.method === 'personal_sign') {
            // Signing done — approve the authenticate request.
            // authId is embedded in the topic because requestId = authId + 1 to bypass the per-session deduplication guard.
            const authId = parseInt(topic.replace('temp_wc_auth_', ''), 10)
            sendToReactEvent('action.approveWalletConnectAuthenticate', {
              id: authId,
              signature: result
            })
          } else if (isWcAuthenticate) {
            // Other methods in the auth flow (e.g. tabCheckin) only set up metadata —
            // they don't yield a response we forward to WalletKit.
          } else {
            sendToReactEvent('action.respondToWalletConnectRequest', {
              topic: params.topic,
              response: { result },
              id: params.requestId
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

        if (isWalletConnect) {
          if (isTempSession) {
            if (isWcAuthenticate) {
              sendToReactEvent('action.rejectWalletConnectAuthenticate', {
                id: params.requestId
              })
            } else {
              sendToReactEvent('action.rejectWalletConnectSession', {
                proposalId: params.requestId
              })
            }
          } else if (isWcAuthenticate && request.method === 'personal_sign') {
            const authId = parseInt(topic.replace('temp_wc_auth_', ''), 10)
            sendToReactEvent('action.rejectWalletConnectAuthenticate', { id: authId })
          } else if (isWcAuthenticate) {
            // tabCheckin/etc errors during auth handshake — no auth response to send.
          } else {
            sendToReactEvent('action.respondToWalletConnectRequest', {
              topic: params.topic,
              response: { error: errorRes }, // Raw error - will be formatted into JSON-RPC by walletConnectService
              id: params.requestId
            })
          }
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
      // Remove temp session if it exists (the one that was created during handshake)
      if (params.tempSessionTopic) {
        mainCtrl.dapps.deleteDappSessionByWcTopic(params.tempSessionTopic)
      }
      // Create actual session
      const session = await mainCtrl.dapps.getOrCreateDappSession({
        url: params.url,
        tabId: params.tabId,
        wcTopic: params.topic
      })
      const messenger = createWcBridgeMessenger(params.topic, params.chainId)
      mainCtrl.dapps.setSessionMessenger(session.sessionId, messenger, false)
      mainCtrl.dapps.setSessionProp(session.sessionId, { name: params.name, icon: params.icon })

      break
    }

    case 'RESTORE_WC_SESSIONS': {
      for (const wcSession of params.sessions) {
        const { topic, name, icon, url, chainId } = wcSession
        try {
          const wcTabId = getWcTabIdFromTopic(topic)
          const session = await mainCtrl.dapps.getOrCreateDappSession({
            url,
            tabId: wcTabId,
            wcTopic: topic
          })
          const messenger = createWcBridgeMessenger(topic, chainId)
          mainCtrl.dapps.setSessionMessenger(session.sessionId, messenger, false)
          mainCtrl.dapps.setSessionProp(session.sessionId, { name, icon })
        } catch (e) {
          console.error('[Worker] Failed to restore WC session for topic:', topic, e)
        }
      }
      break
    }

    default:
      return console.error(
        `Dispatched ${type} action, but handler in the extension background process not found!`
      )
  }
}
