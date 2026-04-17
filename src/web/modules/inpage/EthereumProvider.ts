import { EthereumProvider as CommonEthereumProvider } from '@common/modules/inpage/EthereumProvider'
import { logInfoWithPrefix, logWarnWithPrefix } from '@common/utils/logger'
import { providerRequestTransport } from '@web/extension-services/background/provider/providerRequestTransport'
import { initializeMessenger } from '@web/extension-services/messengers/initializeMessenger'

export class EthereumProvider extends CommonEthereumProvider {
  constructor(
    forwardRpcRequests?: (url: string, method: any, params: any) => Promise<any>,
    getFoundRpcUrls?: () => string[],
    options?: { deferInitialization?: boolean }
  ) {
    const backgroundMessenger = initializeMessenger({ connect: 'background' })
    const externalHandlers = {
      sendRequest: (params: any) => {
        return providerRequestTransport.send(params, { id: params.id })
      },
      onBackgroundMessage: (callback: (msg: any) => Promise<void>) => {
        backgroundMessenger.reply(globalIsAmbireNext ? 'broadcast-next' : 'broadcast', callback)
      },
      logInfo: logInfoWithPrefix,
      logWarn: logWarnWithPrefix
    }

    super(externalHandlers, forwardRpcRequests, getFoundRpcUrls, options)
  }
}
