import { getSessionId, Session } from '@ambire-common/classes/session'
import { MainController } from '@ambire-common/controllers/main/main'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { getDappIdFromUrl } from '@ambire-common/libs/dapps/helpers'
import { KeyIterator } from '@ambire-common/libs/keyIterator/keyIterator'
import LedgerKeyIterator from '@common/modules/hardware-wallet/libs/ledgerKeyIterator'
import TrezorKeyIterator from '@common/modules/hardware-wallet/libs/trezorKeyIterator'
import QrKeyIterator from '@common/modules/hardware-wallets/libs/qrKeyIterator'
import handleProviderRequests from '@common/modules/provider/handleProviderRequests'
import { Action, MethodAction } from '@common/types/actions'
import { getWcTabIdFromTopic } from '@mobile/modules/wallet-connect/utils'
import { setBootPhase, setSubscribedControllers } from '@mobile/modules/webview/services/bootPhase'
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

    case 'SET_VIEW_FOCUS': {
      if (!params.id) return
      mainCtrl.ui.emitViewFocus(params.id)
      break
    }

    case 'SET_BOOT_PHASE': {
      setBootPhase(params.phase)
      break
    }

    case 'SET_SUBSCRIBED_CONTROLLERS': {
      setSubscribedControllers(params.controllers)
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
      const wcTopicsToTerminate =
        params.source === 'injected'
          ? []
          : (Object.values(mainCtrl.dapps.dappSessions) as Session[])
              .filter((s) => s.id === params.id && !!s.wcTopic)
              .map((s) => s.wcTopic as string)

      if (params.source) {
        await mainCtrl.dapps.disconnectDappSource(params.id, params.source)
      } else {
        await mainCtrl.dapps.broadcastDappSessionEvent('disconnect', undefined, params.id)
        mainCtrl.dapps.updateDapp(params.id, {
          connectedSources: [],
          isConnected: false
        })
      }

      for (const topic of wcTopicsToTerminate) {
        sendToReactEvent('action.wcSessionBroadcast', {
          wcSessionTopic: topic,
          chainId: 1,
          event: 'disconnect',
          data: {}
        })
      }

      // Auto-login policies are domain-wide (not per-source), so only revoke when
      // every source is gone — otherwise the surviving channel loses its SIWE state.
      const stillConnected = mainCtrl.dapps.hasPermission(params.id)
      if (!stillConnected) {
        await mainCtrl.autoLogin.revokeAllPoliciesForDomain(params.id, params.url)
      }

      break
    }

    case 'DAPPS_CONTROLLER_DISCONNECT_ALL_DAPPS': {
      // Capture the WC topics up front — broadcasting `disconnect` tears down the WC sessions,
      // so they'd be gone by the time `disconnectAllDapps` returns.
      const wcTopicsToTerminate =
        params.source === 'injected'
          ? []
          : (Object.values(mainCtrl.dapps.dappSessions) as Session[])
              .filter((s) => !!s.wcTopic)
              .map((s) => s.wcTopic as string)

      const disconnectedDapps = await mainCtrl.dapps.disconnectAllDapps(params.source)

      for (const topic of wcTopicsToTerminate) {
        sendToReactEvent('action.wcSessionBroadcast', {
          wcSessionTopic: topic,
          chainId: 1,
          event: 'disconnect',
          data: {}
        })
      }

      // Process sequentially: each disconnect may call `revokeAllPoliciesForDomain`, which
      // is guarded by a status lock that throws if a previous call hasn't finished yet.
      for (const dapp of disconnectedDapps) {
        const stillConnected = mainCtrl.dapps.hasPermission(dapp.id)
        if (!stillConnected) {
          await mainCtrl.autoLogin.revokeAllPoliciesForDomain(dapp.id, dapp.url)
        }
      }

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

    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER': {
      return await mainCtrl.handleAccountPickerInitLedger(LedgerKeyIterator)
    }

    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_TREZOR': {
      return await mainCtrl.handleAccountPickerInitTrezor(TrezorKeyIterator)
    }

    case 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_QR_WALLET': {
      return await mainCtrl.handleAccountPickerInitQr(QrKeyIterator, params.payload)
    }

    case 'WEBVIEW_ORIGIN_CHANGED': {
      try {
        const oldDappId = getDappIdFromUrl(new URL(params.previousOrigin).origin)
        const oldSessionId = getSessionId({ tabId: 1, windowId: undefined, dappId: oldDappId })
        if (mainCtrl.dapps.dappSessions[oldSessionId]) {
          mainCtrl.dapps.deleteDappSession(oldSessionId)
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
        let errorRes
        try {
          errorRes = error.serialize()
        } catch (e) {
          errorRes = { code: error?.code, message: error?.message ?? String(error) }
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
      const resolvedChainId =
        mainCtrl.dapps.pickWalletConnectChainId(params.candidateChainIds) ?? params.chainId
      const messenger = createWcBridgeMessenger(params.topic, resolvedChainId)
      mainCtrl.dapps.setSessionMessenger(session.sessionId, messenger, false)
      mainCtrl.dapps.setSessionProp(session.sessionId, { name: params.name, icon: params.icon })

      const dappId = getDappIdFromUrl(new URL(params.url).origin)
      await mainCtrl.dapps.addDappFromIdentity(
        {
          id: dappId,
          name: params.name ?? new URL(params.url).hostname,
          url: params.url,
          icon: params.icon ?? null,
          chainId: params.chainId,
          candidateChainIds: params.candidateChainIds
        },
        'wc'
      )

      break
    }

    case 'RESTORE_WC_SESSIONS': {
      for (const wcSession of params.sessions) {
        const { topic, name, icon, url, chainId, candidateChainIds } = wcSession
        try {
          const wcTabId = getWcTabIdFromTopic(topic)
          const session = await mainCtrl.dapps.getOrCreateDappSession({
            url,
            tabId: wcTabId,
            wcTopic: topic
          })
          const resolvedChainId =
            mainCtrl.dapps.pickWalletConnectChainId(candidateChainIds) ?? chainId
          const messenger = createWcBridgeMessenger(topic, resolvedChainId)
          mainCtrl.dapps.setSessionMessenger(session.sessionId, messenger, false)
          mainCtrl.dapps.setSessionProp(session.sessionId, { name, icon })

          const dappId = getDappIdFromUrl(new URL(url).origin)
          await mainCtrl.dapps.addDappFromIdentity(
            {
              id: dappId,
              name: name ?? new URL(url).hostname,
              url,
              icon: icon ?? null,
              chainId,
              candidateChainIds
            },
            'wc'
          )
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
