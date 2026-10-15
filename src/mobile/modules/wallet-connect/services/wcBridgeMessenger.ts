import { Messenger } from '@ambire-common/interfaces/messenger'

import { handleWcSessionBroadcast } from './walletConnectService'

/**
 * A Messenger that forwards WalletConnect session broadcast events (disconnect,
 * accountsChanged, chainChanged) to the WalletConnect SDK.
 *
 * When the DappsController broadcasts an event on a WC dapp session, this
 * messenger hands it to walletConnectService, which calls the appropriate SDK
 * method (emitSessionEvent, disconnectSession).
 *
 * This mirrors how mobileMessenger works for the in-app browser, but routes
 * events to the WC SDK instead of the DappWebViewScreen.
 */
export const createWcBridgeMessenger = (wcSessionTopic: string, chainId: number): Messenger => ({
  available: true,
  name: 'wcBridgeMessenger',

  send: <TPayload, TResponse>(topic: string, payload: TPayload): Promise<TResponse> => {
    if (topic.includes('broadcast')) {
      const { event, data } = payload as any
      // Fire-and-forget: the DappsController never reads a response from a
      // broadcast and must not be blocked waiting on the WC SDK.
      handleWcSessionBroadcast({ wcSessionTopic, chainId, event, data }).catch((error) => {
        console.error('[WalletConnect] Failed to broadcast session event', event, error)
      })
    }
    return Promise.resolve(null) as any
  },

  reply: <TPayload, TResponse>(_topic: string, _callback: any): (() => void) => {
    return () => {}
  }
})
