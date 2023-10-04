import { NetworkType } from 'ambire-common/src/constants/networks'
import { intToHex } from 'ethereumjs-util'

import VaultController from '@common/modules/vault/services/VaultController'
import permissionService, {
  ConnectedSite
} from '@mobile/modules/web3/services/webview-background/services/permission'
import sessionService from '@mobile/modules/web3/services/webview-background/services/session'

import notificationService from './services/notification'

export class WalletController {
  isUnlocked = () => VaultController.isVaultUnlocked()

  getConnectedSite = permissionService.getConnectedSite

  requestVaultControllerMethod = (method, props) => {
    return VaultController[method](props)
  }

  setStorage = (key: string, value: any) => sessionService.broadcastEvent(key, value)

  getCurrentSite = (tabId: number, domain: string): ConnectedSite | null => {
    const { origin, name, icon } = sessionService.getSession(`${tabId}-${domain}`) || {}
    if (!origin) {
      return null
    }
    const site = permissionService.getSite(origin)
    if (site) {
      return site
    }
    return {
      origin,
      name: name!,
      icon: icon!,
      isConnected: false,
      isSigned: false,
      isTop: false
    }
  }

  removeConnectedSite = (origin: ConnectedSite['origin']) => {
    sessionService.broadcastEvent('accountsChanged', [], origin)
    permissionService.removeConnectedSite(origin)
  }

  getConnectedSites = permissionService.getConnectedSites

  activeFirstApproval = () => {
    notificationService.activeFirstApproval()
  }

  getApproval = notificationService.getApproval

  resolveApproval = notificationService.resolveApproval

  rejectApproval = (err?: string, stay = false, isInternal = false) => {
    return notificationService.rejectApproval(err, stay, isInternal)
  }

  networkChange = (network: NetworkType) => {
    sessionService.broadcastEvent('chainChanged', {
      chain: intToHex(network.chainId),
      networkVersion: `${network.chainId}`
    })
  }

  accountChange = (selectedAcc: string) => {
    const account = selectedAcc ? [selectedAcc] : []
    sessionService.broadcastEvent('accountsChanged', account)
  }
}

export default new WalletController()
