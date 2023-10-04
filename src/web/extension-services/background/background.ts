import { areRpcProvidersInitialized, initRpcProviders } from 'ambire-common/src/services/provider'

import VaultController from '@common/modules/vault/services/VaultController'
import { rpcProviders } from '@common/services/providers'
import providerController from '@web/extension-services/background/provider/provider'
import permissionService from '@web/extension-services/background/services/permission'
import sessionService from '@web/extension-services/background/services/session'
import WalletController from '@web/extension-services/background/wallet'
import storage from '@web/extension-services/background/webapi/storage'
import eventBus from '@web/extension-services/event/eventBus'
import PortMessage from '@web/extension-services/message/portMessage'
import getOriginFromUrl from '@web/utils/getOriginFromUrl'

async function init() {
  // Initialize rpc providers for all networks
  const shouldInitProviders = !areRpcProvidersInitialized()
  if (shouldInitProviders) {
    initRpcProviders(rpcProviders)
  }

  const vault = await storage.get('vault')
  VaultController.loadStore(vault)
  VaultController.store.subscribe((value) => storage.set('vault', value))
  await permissionService.init()
}

init()

// listen for messages from UI
browser.runtime.onConnect.addListener(async (port) => {
  if (port.name === 'popup' || port.name === 'notification' || port.name === 'tab') {
    const pm = new PortMessage(port)
    pm.listen((data) => {
      if (data?.type) {
        switch (data.type) {
          case 'broadcast':
            eventBus.emit(data.method, data.params)
            break
          case 'controller':
          default:
            if (data.method) {
              return WalletController[data.method].apply(null, data.params)
            }
        }
      }
    })

    const boardcastCallback = (data: any) => {
      pm.request({
        type: 'broadcast',
        method: data.method,
        params: data.params
      })
    }

    if (port.name === 'popup') {
      // TODO:
      // preferenceService.setPopupOpen(true)

      port.onDisconnect.addListener(() => {
        // TODO:
        // preferenceService.setPopupOpen(false)
      })
    }
    eventBus.addEventListener('broadcastToUI', boardcastCallback)
    port.onDisconnect.addListener(() => {
      eventBus.removeEventListener('broadcastToUI', boardcastCallback)
    })

    return
  }

  if (!port.sender?.tab) {
    return
  }

  const pm = new PortMessage(port)

  pm.listen(async (data) => {
    // TODO:
    // if (!appStoreLoaded) {
    //   throw ethErrors.provider.disconnected()
    // }

    const sessionId = port.sender?.tab?.id
    if (sessionId === undefined || !port.sender?.url) {
      return
    }

    const origin = getOriginFromUrl(port.sender.url)
    const session = sessionService.getOrCreateSession(sessionId, origin)

    const req = { data, session, origin }
    // for background push to respective page
    req.session!.setPortMessage(pm)

    // Temporarily resolves the subscription methods as successful
    // but the rpc block subscription is actually not implemented because it causes app crashes
    if (data?.method === 'eth_subscribe' || data?.method === 'eth_unsubscribe') {
      return true
    }

    return providerController(req)
  })
})

// On first install, open Ambire Extension in new tab to start the login process
browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    const extensionURL = browser.runtime.getURL('tab.html')
    browser.tabs.create({ url: extensionURL })
  }
})
