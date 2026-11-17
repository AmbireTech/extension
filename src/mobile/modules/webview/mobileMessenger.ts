import { Messenger } from '@ambire-common/interfaces/messenger'
import { emitDappEventBroadcast } from '@mobile/services/controllerHost/uiEvents'

/**
 * A mobile-specific Messenger implementation that routes broadcast session events
 * (e.g. disconnect, accountsChanged, chainChanged) to the DappWebViewScreen,
 * which then injects them into the visible dapp WebView.
 *
 * This mirrors the role that bridgeMessenger plays on the web extension:
 * background → content script → inpage provider.
 *
 * Mobile equivalent:
 * DappsController → eventBus → DappWebViewScreen → injectJavaScript
 */
export const mobileMessenger: Messenger = {
  available: true,
  name: 'mobileMessenger',

  send: <TPayload, TResponse>(
    topic: string,
    payload: TPayload,
    options?: { id?: string | number; tabId?: number; [key: string]: any }
  ): Promise<TResponse> => {
    if (topic.includes('broadcast')) {
      const { event, data, origin } = payload as any
      emitDappEventBroadcast({
        event,
        data,
        origin,
        tabId: options?.tabId
      })
    }
    return Promise.resolve(null) as any
  },

  reply: <TPayload, TResponse>(_topic: string, _callback: any): (() => void) => {
    return () => {}
  }
}
