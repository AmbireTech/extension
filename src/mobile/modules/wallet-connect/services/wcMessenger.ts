import { WalletKit } from '@reown/walletkit'
import { getSdkError } from '@walletconnect/utils'

export const createWcMessenger = (walletKit: WalletKit, topic: string, chainId: number) => ({
  available: true,
  name: 'wcMessenger',
  send: async (msgTopic: string, payload: any) => {
    if (msgTopic.includes('broadcast')) {
      const { event, data } = payload

      // When the user disconnects the dApp from the Ambire UI, DappsController
      // broadcasts 'disconnect'. We translate this into a WC disconnect.
      if (event === 'disconnect') {
        await walletKit.disconnectSession({
          topic,
          reason: getSdkError('USER_DISCONNECTED')
        })
        return null as any
      }

      // Other events (accountsChanged, chainChanged)
      await walletKit.emitSessionEvent({
        topic,
        event: { name: event, data },
        chainId: `eip155:${chainId}`
      })
    }
    return null as any
  },
  reply: () => () => {}
})
