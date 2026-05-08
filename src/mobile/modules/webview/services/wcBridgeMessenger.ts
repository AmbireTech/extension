import { Messenger } from '@ambire-common/interfaces/messenger'

import { sendToReactEvent } from './webviewLogger'

/**
 * A webview-side Messenger that bridges WalletConnect session broadcast events
 * (disconnect, accountsChanged, chainChanged) back to the React Native side.
 *
 * When the DappsController broadcasts an event on a WC dapp session, this
 * messenger posts it to RN via sendToReactEvent. The RN side then calls the
 * appropriate WalletConnect SDK method (emitSessionEvent, disconnectSession).
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
      sendToReactEvent('action.wcSessionBroadcast', {
        wcSessionTopic,
        chainId,
        event,
        data
      })
    }
    return Promise.resolve(null) as any
  },

  reply: <TPayload, TResponse>(_topic: string, _callback: any): (() => void) => {
    return () => {}
  }
})
