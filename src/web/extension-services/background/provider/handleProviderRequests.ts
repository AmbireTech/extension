import { ethErrors } from 'eth-rpc-errors'

import { Session } from '@ambire-common/classes/session'
import { MainController } from '@ambire-common/controllers/main/main'
import { DappProviderRequest } from '@ambire-common/interfaces/dapp'
import { isDev } from '@common/config/env'
import { ProviderController } from '@web/extension-services/background/provider/ProviderController'
import rpcFlow from '@web/extension-services/background/provider/rpcFlow'
import { openInternalPageInTab } from '@web/extension-services/background/webapi/tab'

const handleProviderRequests = async (
  request: DappProviderRequest & { session: Session },
  mainCtrl: MainController
): Promise<any> => {
  const { method, params, session } = request

  if (method === 'tabCheckin') {
    mainCtrl.dapps.setSessionProp(session.sessionId, {
      origin: request.origin,
      name: params.name,
      icon: params.icon
    })
    return
  }

  if (method === 'getProviderState') {
    const providerController = new ProviderController(mainCtrl)
    const isUnlocked = mainCtrl.keystore.isUnlocked
    const chainId = await providerController.ethChainId(request)
    let networkVersion = '1'

    try {
      networkVersion = parseInt(chainId, 16).toString()
    } catch (error) {
      networkVersion = '1'
    }

    return {
      chainId,
      isUnlocked,
      accounts: isUnlocked ? await providerController.ethAccounts(request) : [],
      networkVersion
    }
  }

  if (method === 'eth_sign') {
    throw ethErrors.provider.custom({
      code: 1001,
      message:
        "Signing with 'eth_sign' can lead to asset loss. For your safety, Ambire does not support this method."
    })
  }

  if (method === 'open-wallet-route') {
    const ORIGINS_WHITELIST = ['https://legends.ambire.com', 'https://legends-staging.ambire.com']

    if (isDev) {
      ORIGINS_WHITELIST.push('http://localhost:19006')
      ORIGINS_WHITELIST.push('http://localhost:19007')
    }

    if (!ORIGINS_WHITELIST.includes(session.origin)) {
      throw new Error('This page is restricted from directly opening Ambire extension pages')
    }

    await openInternalPageInTab(params.route)
    return null
  }

  return rpcFlow(request, mainCtrl)
}

export default handleProviderRequests
