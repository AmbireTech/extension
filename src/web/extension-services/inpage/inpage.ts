/* eslint-disable no-param-reassign */
// Script that is injected into dapp's context through content-script. it mounts ethereum to window

import networks, { NetworkId } from 'ambire-common/src/constants/networks'
import { ethErrors, serializeError } from 'eth-rpc-errors'
import { intToHex } from 'ethereumjs-util'
import { providers } from 'ethers'
import { EventEmitter } from 'events'
import { forIn, isUndefined } from 'lodash'

import { delayPromise } from '@common/utils/promises'
import { ETH_RPC_METHODS_AMBIRE_MUST_HANDLE } from '@web/constants/common'
import { DAPP_PROVIDER_URLS } from '@web/extension-services/inpage/config/dapp-providers'
import DedupePromise from '@web/extension-services/inpage/services/dedupePromise'
import PushEventHandlers from '@web/extension-services/inpage/services/pushEventsHandlers'
import ReadyPromise from '@web/extension-services/inpage/services/readyPromise'
import BroadcastChannelMessage from '@web/extension-services/message/broadcastChannelMessage'
import { logInfoWithPrefix, logWarnWithPrefix } from '@web/utils/logger'

declare const channelName: any

export interface Interceptor {
  onRequest?: (data: any) => any
  onResponse?: (res: any, data: any) => any
}

interface StateProvider {
  accounts: string[] | null
  isConnected: boolean
  isUnlocked: boolean
  initialized: boolean
  isPermanentlyDisconnected: boolean
}

// keep isMetaMask and remove isAmbire
const impersonateMetamaskWhitelist = [
  // layerzero
  'bitcoinbridge.network',
  'bridge.liquidswap.com',
  'theaptosbridge.com',
  'app.actafi.org',

  // rainbow
  'goal3.xyz',
  'enso.finance',
  'telx.network',
  'link3.to',
  'hypercerts.org',

  'quickswap.exchange'
]

// keep isAmbire and remove isMetaMask
const ambireHostList: string[] = []

const isIncludesHost = (current: string, target: string) => {
  return current === target || current.endsWith(`.${target}`)
}

const isInHostList = (list: string[], host: string) => {
  return list.some((target) => isIncludesHost(host, target))
}

export const getProviderMode = (host: string) => {
  if (isInHostList(impersonateMetamaskWhitelist, host)) {
    return 'metamask'
  }
  if (isInHostList(ambireHostList, host)) {
    return 'ambire'
  }
  return 'default'
}

export const patchProvider = (provider: any) => {
  const mode = getProviderMode(window.location.hostname)
  try {
    if (mode === 'metamask') {
      delete provider.isAmbire
      provider.isMetaMask = true
      return
    }
    if (mode === 'ambire') {
      delete provider.isMetaMask
      provider.isAmbire = true
      return
    }
    if (mode === 'default') {
      provider.isMetaMask = true
      provider.isAmbire = true
      return
    }
  } catch (e) {
    console.error(e)
  }
}

const domReadyCall = (callback: any) => {
  if (document.readyState === 'complete') {
    callback()
  } else {
    const domContentLoadedHandler = () => {
      callback()
      document.removeEventListener('DOMContentLoaded', domContentLoadedHandler)
    }
    document.addEventListener('DOMContentLoaded', domContentLoadedHandler)
  }
}

const $document = document.querySelector.bind(document)

export class EthereumProvider extends EventEmitter {
  chainId: string | null = null

  selectedAddress: string | null = null

  /**
   * The network ID of the currently connected Ethereum chain.
   * @deprecated
   */
  networkVersion: string | null = null

  dAppOwnProviders: {
    [key in NetworkId]?: providers.JsonRpcProvider | providers.WebSocketProvider | null
  } = {}

  isAmbire = true

  isMetaMask = true

  _isAmbire = true

  _isReady = false

  _isConnected = false

  _initialized = false

  _isUnlocked = false

  _cacheRequestsBeforeReady: any[] = []

  _cacheEventListenersBeforeReady: [string | symbol, () => any][] = []

  _state: StateProvider = {
    accounts: null,
    isConnected: false,
    isUnlocked: false,
    initialized: false,
    isPermanentlyDisconnected: false
  }

  _metamask = {
    isUnlocked: () => {
      return new Promise((resolve) => {
        resolve(this._isUnlocked)
      })
    }
  }

  private _pushEventHandlers: PushEventHandlers

  private _requestPromise = new ReadyPromise(2)

  private _dedupePromise = new DedupePromise([
    'personal_sign',
    'wallet_addEthereumChain',
    'eth_signTypedData',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4'
  ])

  private _bcm = new BroadcastChannelMessage(channelName)

  constructor({ maxListeners = 100 } = {}) {
    super()
    this.setMaxListeners(maxListeners)
    this.initialize()
    this.shimLegacy()
    this._pushEventHandlers = new PushEventHandlers(this)
  }

  initialize = async () => {
    document.addEventListener('visibilitychange', this._requestPromiseCheckVisibility)

    this._bcm.connect().on('message', this._handleBackgroundMessage)
    domReadyCall(() => {
      const origin = location.origin
      const icon =
        ($document('head > link[rel~="icon"]') as HTMLLinkElement)?.href ||
        ($document('head > meta[itemprop="image"]') as HTMLMetaElement)?.content

      const name =
        document.title ||
        ($document('head > meta[name="title"]') as HTMLMetaElement)?.content ||
        origin

      this._bcm.request({
        method: 'tabCheckin',
        params: { icon, name, origin }
      })

      this._requestPromise.check(2)
    })

    try {
      const { chainId, accounts, networkVersion, isUnlocked }: any = await this.request({
        method: 'getProviderState'
      })
      if (isUnlocked) {
        this._isUnlocked = true
        this._state.isUnlocked = true
      }
      this.chainId = chainId
      this.networkVersion = networkVersion
      this.emit('connect', { chainId })
      this._pushEventHandlers.chainChanged({
        chain: chainId,
        networkVersion
      })

      this._pushEventHandlers.accountsChanged(accounts)

      // eslint-disable-next-line no-restricted-globals
      const { hostname } = location
      if (DAPP_PROVIDER_URLS[hostname]) {
        // eslint-disable-next-line no-restricted-syntax
        forIn(DAPP_PROVIDER_URLS[hostname], async (providerUrl, networkId) => {
          const network = networks.find((n) => n.id === networkId)
          if (!network || !providerUrl) return

          try {
            this.dAppOwnProviders[network.id] = providerUrl.startsWith('wss:')
              ? new providers.WebSocketProvider(providerUrl, {
                  name: network.name,
                  chainId: network.chainId
                })
              : new providers.JsonRpcProvider(providerUrl, {
                  name: network.name,
                  chainId: network.chainId
                })

            // Acts as a mechanism to check if the provider credentials work
            // eslint-disable-next-line no-await-in-loop
            await Promise.race([
              this.dAppOwnProviders[network.id]?.getNetwork(),
              // Timeouts after 3 secs because sometimes the provider call hangs with no response
              delayPromise(3000)
            ])
            logInfoWithPrefix(`👌 The dApp's own provider initiated for ${network.name} network.`)
          } catch (e) {
            this.dAppOwnProviders[network.id] = null
            logWarnWithPrefix(
              `The dApp's own provider for ${network.name} network failed to init.`,
              e
            )
          }
        })
      }
    } catch {
      //
    } finally {
      this._initialized = true
      this._state.initialized = true
      this.emit('_initialized')
    }
  }

  private _requestPromiseCheckVisibility = () => {
    if (document.visibilityState === 'visible') {
      this._requestPromise.check(1)
    } else {
      this._requestPromise.uncheck(1)
    }
  }

  private _handleBackgroundMessage = ({ event, data }) => {
    if (this._pushEventHandlers[event]) {
      return this._pushEventHandlers[event](data)
    }

    this.emit(event, data)
  }

  isConnected = () => {
    return true
  }

  // TODO: support multi request!
  request = async (data) => {
    if (!this._isReady) {
      const promise = new Promise((resolve, reject) => {
        this._cacheRequestsBeforeReady.push({
          data,
          resolve,
          reject
        })
      })
      return promise
    }
    return this._dedupePromise.call(data.method, () => this._request(data))
  }

  _request = async (data) => {
    if (!data) {
      throw ethErrors.rpc.invalidRequest()
    }

    this._requestPromiseCheckVisibility()

    return this._requestPromise.call(async () => {
      if (
        data.method.startsWith('eth_') &&
        !ETH_RPC_METHODS_AMBIRE_MUST_HANDLE.includes(data.method)
      ) {
        const network = networks.find((n) => intToHex(n.chainId) === this.chainId)
        if (network?.id && this.dAppOwnProviders[network.id]) {
          if (data.method !== 'eth_call') {
            logInfoWithPrefix('[⏩ forwarded request]', data)
          }

          try {
            const result = await Promise.race([
              this.dAppOwnProviders[network.id]?.send(data.method, data.params),
              // Timeouts after 3 secs because sometimes the provider call hangs with no response
              delayPromise(3000)
            ])

            if (data.method !== 'eth_call') {
              logInfoWithPrefix('[⏩ forwarded request: success]', data.method, result)
            }

            // Otherwise, if no result comes, do not return, fallback to our provider.
            if (!isUndefined(result)) return result
          } catch (err) {
            //  Do not throw on error because there is fallback to our provider.
            if (data.method !== 'eth_call') {
              logWarnWithPrefix('[⏩ forwarded request: error]', data.method, err)
            }
          }
        }
      }

      if (data.method !== 'eth_call') {
        logInfoWithPrefix('[request]', data)
      }

      return this._bcm
        .request(data)
        .then((res) => {
          if (data.method !== 'eth_call') {
            logInfoWithPrefix('[request: success]', data.method, res)
          }
          return res
        })
        .catch((err) => {
          if (data.method !== 'eth_call') {
            logInfoWithPrefix('[request: error]', data.method, serializeError(err))
          }
          throw serializeError(err)
        })
    })
  }

  requestInternalMethods = (data) => {
    return this._dedupePromise.call(data.method, () => this._request(data))
  }

  // shim to matamask legacy api
  sendAsync = (payload, callback) => {
    if (Array.isArray(payload)) {
      return Promise.all(
        payload.map(
          (item) =>
            new Promise((resolve) => {
              this.sendAsync(item, (err, res) => {
                // ignore error
                resolve(res)
              })
            })
        )
      ).then((result) => callback(null, result))
    }
    if (typeof payload === 'object') {
      const { method, params, ...rest } = payload
      this.request({ method, params })
        .then((result) => callback(null, { ...rest, method, result }))
        .catch((error) => callback(error, { ...rest, method, error }))
    } else {
      callback(null)
    }
  }

  send = (payload, callback?) => {
    if (typeof payload === 'string' && (!callback || Array.isArray(callback))) {
      // send(method, params? = [])
      return this.request({
        method: payload,
        params: callback
      }).then((result) => ({
        id: undefined,
        jsonrpc: '2.0',
        result
      }))
    }

    if (typeof payload === 'object' && typeof callback === 'function') {
      return this.sendAsync(payload, callback)
    }

    let result
    switch (payload.method) {
      case 'eth_accounts':
        result = this.selectedAddress ? [this.selectedAddress] : []
        break

      case 'eth_coinbase':
        result = this.selectedAddress || null
        break

      default:
        throw new Error("sync method doesn't support")
    }

    return {
      id: payload.id,
      jsonrpc: payload.jsonrpc,
      result
    }
  }

  shimLegacy = () => {
    const legacyMethods = [
      ['enable', 'eth_requestAccounts'],
      ['net_version', 'net_version']
    ]

    for (const [_method, method] of legacyMethods) {
      this[_method] = () => this.request({ method })
    }
  }

  on = (event: string | symbol, handler: (...args: any[]) => void) => {
    if (!this._isReady) {
      this._cacheEventListenersBeforeReady.push([event, handler])
      return this
    }
    return super.on(event, handler)
  }
}

declare global {
  interface Window {
    ethereum: EthereumProvider
    web3: any
  }
}

const provider = new EthereumProvider()
patchProvider(provider)
let cacheOtherProvider: EthereumProvider | null = null
const ambireProvider = new Proxy(provider, {
  deleteProperty: (target, prop) => {
    if (typeof prop === 'string' && ['on', 'isAmbire', 'isMetaMask', '_isAmbire'].includes(prop)) {
      // @ts-ignore
      delete target[prop]
    }
    return true
  }
})

// TODO: Take (ans switch this setting from the Ambire settings)
const isDefaultWallet = true
// ambireProvider.on('defaultWalletChanged', switchWalletNotice)

let finalProvider: EthereumProvider | null = null

if (window.ethereum && !window.ethereum._isAmbire) {
  provider.requestInternalMethods({
    method: 'hasOtherProvider',
    params: []
  })
  cacheOtherProvider = window.ethereum
}

if (isDefaultWallet || !cacheOtherProvider) {
  finalProvider = ambireProvider
  try {
    const customizeEthereum = {
      ...window.ethereum
    }
    Object.keys(finalProvider).forEach((key) => {
      customizeEthereum[key] = finalProvider[key]
    })
    patchProvider(customizeEthereum)
    Object.defineProperty(window, 'ethereum', {
      set() {
        provider.requestInternalMethods({
          method: 'hasOtherProvider',
          params: []
        })
        return finalProvider
      },
      get() {
        return finalProvider
      }
    })
  } catch (e) {
    // think that defineProperty failed means there is any other wallet
    provider.requestInternalMethods({
      method: 'hasOtherProvider',
      params: []
    })
    console.error(e)
    window.ethereum = finalProvider
  }
  if (!window.web3) {
    window.web3 = {
      currentProvider: ambireProvider
    }
  }
  finalProvider._isReady = true
  // finalProvider.on('ambire:chainChanged', switchChainNotice)
} else {
  finalProvider = cacheOtherProvider
  // @ts-ignore
  delete ambireProvider.on
  // @ts-ignore
  delete ambireProvider.isAmbire
  // @ts-ignore
  delete ambireProvider._isAmbire
  Object.keys(finalProvider).forEach((key) => {
    // @ts-ignore
    window.ethereum[key] = (finalProvider as EthereumProvider)[key]
  })
}
provider._cacheEventListenersBeforeReady.forEach(([event, handler]) => {
  ;(finalProvider as EthereumProvider).on(event, handler)
})
provider._cacheRequestsBeforeReady.forEach(({ resolve, reject, data }) => {
  ;(finalProvider as EthereumProvider).request(data).then(resolve).catch(reject)
})

if (window.ethereum) {
  cacheOtherProvider = window.ethereum
  provider.requestInternalMethods({
    method: 'hasOtherProvider',
    params: []
  })
}

window.ethereum = ambireProvider

try {
  Object.defineProperty(window, 'ethereum', {
    set(val) {
      if (val?._isAmbire) {
        return
      }
      provider.requestInternalMethods({
        method: 'hasOtherProvider',
        params: []
      })
      cacheOtherProvider = val
    },
    get() {
      return ambireProvider
    }
  })
} catch (e) {
  console.error(e)
  // To prevent Object.defineProperty from other wallet, inject ethereum provider directly
  window.ethereum = ambireProvider
}

if (!window.web3) {
  window.web3 = {
    currentProvider: window.ethereum
  }
}

window.dispatchEvent(new Event('ethereum#initialized'))
