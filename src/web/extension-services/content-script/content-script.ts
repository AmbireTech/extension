/* eslint-disable @typescript-eslint/no-floating-promises */

//
// Content Script is mainly a relayer between pageContext(injected script) and the background service_worker
//

import { isManifestV3 } from '@web/constants/browserapi'
import { storage } from '@web/extension-services/background/webapi/storage'

import { initializeMessenger } from '../messengers'
import { setupBridgeMessengerRelay } from '../messengers/internal/bridge'

if (isManifestV3) {
  setupBridgeMessengerRelay()
}

// the injection for manifest v3 is located in background.js
if (!isManifestV3) {
  const injectProviderScript = () => {
    // the script element with src won't execute immediately use inline script element instead!
    const container = document.head || document.documentElement
    const ele = document.createElement('script')
    const ele2 = document.createElement('script')
    // The string is then replaced by AssetReplacePlugin in webpack.
    // The idea is to inject inpage.js into the page context.
    ele.textContent = '#AMBIREINPAGE#'
    // Otherwise the script will mess with the global scope of the page
    ele.type = 'module'
    container.insertBefore(ele, container.children[0])
    ele2.textContent = '#ETHEREUMINPAGE#'
    ele2.type = 'module'
    container.insertBefore(ele2, container.children[1])
    container.removeChild(ele)
    container.removeChild(ele2)
  }

  injectProviderScript()

  setupBridgeMessengerRelay()

  const inpageMessenger = initializeMessenger({ connect: 'inpage' })
  browser.storage.onChanged.addListener(async (changes: any, namespace: any) => {
    // eslint-disable-next-line no-prototype-builtins
    if (namespace === 'local' && changes.hasOwnProperty('isDefaultWallet')) {
      const isDefaultWallet = JSON.parse(changes.isDefaultWallet.newValue)
      inpageMessenger.send('broadcast', {
        data: {
          type: 'setDefaultWallet',
          value: isDefaultWallet ? 'AMBIRE' : 'OTHER',
          shouldReload: true
        }
      })
    }
  })

  const initIsDefaultWallet = async () => {
    const isDefaultWallet = await storage.get('isDefaultWallet', true)
    inpageMessenger.send('broadcast', {
      data: {
        type: 'setDefaultWallet',
        value: isDefaultWallet ? 'AMBIRE' : 'OTHER',
        shouldReload: false
      }
    })
  }

  setTimeout(() => {
    initIsDefaultWallet()
  }, 1)
}
