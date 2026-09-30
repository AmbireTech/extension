import '@common/modules/inpage/globals'

import {
  AMBIRE_PROVIDER_INFO,
  announceEip6963Provider,
  METAMASK_DISGUISE_PROVIDER_INFO
} from '@common/modules/inpage/eip6963'

import { EthereumProvider } from './EthereumProvider'

let isDapp = false
let isDisguisedAsMetaMask = false

const provider = new EthereumProvider({
  deferInitialization: false
})
const ambireProvider = new Proxy(provider, {
  deleteProperty: (target, prop) => {
    if (typeof prop === 'string' && ['on', 'isAmbire', 'isMetaMask'].includes(prop)) {
      // @ts-ignore
      delete target[prop]
    }
    return true
  }
})

export { ambireProvider }

if (globalIsAmbireNext) {
  window.ambireNext = ambireProvider
} else {
  window.ambire = ambireProvider
}

window.__ambire_handleEvent = (event: string, data: any) => {
  provider.handleEvent(event, data)
}

provider.setOnDisguiseAsMetaMask(() => {
  isDisguisedAsMetaMask = true
  announceEip6963Provider(ambireProvider, METAMASK_DISGUISE_PROVIDER_INFO)
})

window.addEventListener<any>('eip6963:requestProvider', () => {
  announceEip6963Provider(ambireProvider, AMBIRE_PROVIDER_INFO)
  if (isDisguisedAsMetaMask)
    announceEip6963Provider(ambireProvider, METAMASK_DISGUISE_PROVIDER_INFO)

  if (!isDapp) {
    try {
      // throw an Error to determine the source of the request
      throw new Error()
    } catch (error: any) {
      const stack = error?.stack // Parse the stack trace to get the caller info
      if (stack) {
        const callerPage = (typeof stack === 'string' && stack.split('\n')[2]?.trim()) || ''
        if (callerPage.includes(window.location.hostname)) {
          isDapp = true
          // Send a request to the provider to notify the background session that this page is a dApp
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          ambireProvider.request({ method: 'eth_chainId', params: [] })
        }
      }
    }
  }
})

announceEip6963Provider(ambireProvider, AMBIRE_PROVIDER_INFO)

window.dispatchEvent(new Event('ethereum#initialized'))
