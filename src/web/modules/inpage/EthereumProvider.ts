import { EthereumProvider as CommonEthereumProvider } from '@common/modules/inpage/EthereumProvider'
import { logInfoWithPrefix } from '@common/utils/logger'
import { initializeMessenger } from '@web/extension-services/messengers/initializeMessenger'
import { providerRequestTransport } from '@web/modules/provider/providerRequestTransport'

export class EthereumProvider extends CommonEthereumProvider {
  constructor(options?: { deferInitialization?: boolean }) {
    const backgroundMessenger = initializeMessenger({ connect: 'background' })
    const externalHandlers = {
      sendRequest: (params: any) => {
        return providerRequestTransport.send(params, { id: params.id })
      },
      onBackgroundMessage: (callback: (msg: any) => Promise<void>) => {
        backgroundMessenger.reply(globalIsAmbireNext ? 'broadcast-next' : 'broadcast', callback)
      },
      logInfo: logInfoWithPrefix
    }

    super(externalHandlers, options)
  }
}
