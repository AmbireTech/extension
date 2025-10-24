import { ethErrors } from 'eth-rpc-errors'

import { Session } from '@ambire-common/classes/session'
import { MainController } from '@ambire-common/controllers/main/main'
import { DappProviderRequest } from '@ambire-common/interfaces/dapp'
import { isDev } from '@common/config/env'
import AutoLockController from '@web/extension-services/background/controllers/auto-lock'
import { WalletStateController } from '@web/extension-services/background/controllers/wallet-state'
import { ProviderController } from '@web/extension-services/background/provider/ProviderController'
import rpcFlow from '@web/extension-services/background/provider/rpcFlow'
import { openInternalPageInTab } from '@web/extension-services/background/webapi/tab'

const handleProviderRequests = async (
  request: DappProviderRequest & { session: Session },
  mainCtrl: MainController,
  walletStateCtrl: WalletStateController,
  autoLockCtrl: AutoLockController,
  requestId: number,
  providerId: number
): Promise<any> => {
  const { method, params, session } = request

  if (requestId === 0) {
    mainCtrl.dapps.resetSessionLastHandledRequestsId(session.sessionId, providerId)
  }

  if (method === 'registerUserActivity' && mainCtrl.dapps.hasPermission(session.id)) {
    autoLockCtrl.setLastActiveTime()
    return
  }

  if (method === 'contentScriptReady') {
    await mainCtrl.dapps.broadcastDappSessionEvent('tabCheckin', undefined, session.id, true)
    const providerController = new ProviderController(mainCtrl)
    const isUnlocked = mainCtrl.keystore.isUnlocked
    const chainId = await providerController.ethChainId(request)
    let networkVersion = '1'

    try {
      networkVersion = parseInt(chainId, 16).toString()
    } catch (error) {
      networkVersion = '1'
    }

    await mainCtrl.dapps.broadcastDappSessionEvent(
      'setProviderState',
      {
        chainId,
        isUnlocked,
        accounts: isUnlocked ? await providerController.ethAccounts(request) : [],
        networkVersion
      },
      session.id
    )
    return
  }

  if (method === 'tabCheckin') {
    const existingDapp = mainCtrl.dapps.getDapp(session.id)

    mainCtrl.dapps.setSessionProp(session.sessionId, {
      name: existingDapp?.name || params.name,
      icon: existingDapp?.icon || params.icon
    })
    if (!existingDapp) {
      mainCtrl.dapps.updateDapp(mainCtrl.dapps.dappSessions[session.sessionId].id, {
        name: params.name
      })
    }
    mainCtrl.dapps.resetSessionLastHandledRequestsId(session.sessionId)
    return
  }

  // Temporarily resolves the subscription methods as successful
  // but the rpc block subscription is actually not implemented because it causes app crashes
  if (method === 'eth_subscribe' || method === 'eth_unsubscribe') {
    return true
  }

  // Prevents handling the same request more than once
  if (session.lastHandledRequestIds[providerId] >= requestId) return
  mainCtrl.dapps.setSessionLastHandledRequestsId(
    session.sessionId,
    providerId,
    requestId,
    // Exclude 'getProviderState' as it's always requested on document ready
    method !== 'getProviderState'
  )

  if (method === 'getProviderState') {
    await walletStateCtrl.initialLoadPromise

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
      networkVersion,
      logLevel: walletStateCtrl.logLevel
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
    const ORIGINS_WHITELIST = [
      'https://legends.ambire.com',
      'https://rewards.ambire.com',
      'https://legends-staging.ambire.com',
      'https://rewards-staging.ambire.com'
    ]

    if (isDev) {
      ORIGINS_WHITELIST.push('http://localhost:19006')
      ORIGINS_WHITELIST.push('http://localhost:19007')
    }

    if (!ORIGINS_WHITELIST.includes(session.origin)) {
      throw new Error('This page is restricted from directly opening Ambire extension pages')
    }

    await openInternalPageInTab({
      route: params.route,
      windowId: mainCtrl.requests.actions.actionWindow.windowProps?.createdFromWindowId
    })
    return null
  }

  return rpcFlow(request, mainCtrl)
}

export default handleProviderRequests
