/* eslint-disable no-restricted-globals */
import { ethErrors, serializeError } from 'eth-rpc-errors'
import { EventEmitter } from 'events'

import { Messenger } from '@ambire-common/interfaces/messenger'
import { delayPromise } from '@common/utils/promises'
import { ETH_RPC_METHODS_AMBIRE_MUST_HANDLE } from '@web/constants/common'
import { providerRequestTransport } from '@web/extension-services/background/provider/providerRequestTransport'
import DedupePromise from '@web/extension-services/inpage/services/dedupePromise'
import PushEventHandlers from '@web/extension-services/inpage/services/pushEventsHandlers'
import ReadyPromise from '@web/extension-services/inpage/services/readyPromise'
import { initializeMessenger } from '@web/extension-services/messengers/initializeMessenger'
import {
  isCrossOriginFrame,
  isTooDeepFrameInTheFrameHierarchy
} from '@web/extension-services/utils/frames'
import logger, { LOG_LEVELS, logInfoWithPrefix, logWarnWithPrefix } from '@web/utils/logger'

export interface StateProvider {
  accounts: string[] | null
  isConnected: boolean
  isUnlocked: boolean
  initialized: boolean
  isPermanentlyDisconnected: boolean
}

const $ = document.querySelector.bind(document)

const domReadyCall = (callback: any) => {
  if (document.readyState === 'loading') {
    const domContentLoadedHandler = () => {
      callback()
      document.removeEventListener('DOMContentLoaded', domContentLoadedHandler)
    }
    document.addEventListener('DOMContentLoaded', domContentLoadedHandler)
  } else {
    callback()
  }
}

function getIconWithRetry(delay = 1000): Promise<string> {
  const tryFind = (): string | null => {
    const linkIcon = document.querySelector('link[rel~="icon"]') as HTMLLinkElement | null
    if (linkIcon?.href) {
      try {
        return new URL(linkIcon.href, document.baseURI).href
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }

    const metaImage = document.querySelector('meta[itemprop="image"]') as HTMLMetaElement | null
    if (metaImage?.content) {
      try {
        return new URL(metaImage.content, document.baseURI).href
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }

    return null
  }

  return new Promise((resolve) => {
    const icon = tryFind()
    // eslint-disable-next-line no-promise-executor-return
    if (icon) return resolve(icon)

    setTimeout(() => {
      const secondTry = tryFind()
      if (secondTry) {
        resolve(secondTry)
      } else {
        resolve(new URL('/favicon.ico', document.baseURI).href)
      }
    }, delay)
  })
}

function guessDappName(rawName: string) {
  const host = location.hostname.replace(/^www\./, '')
  const parts = host.split('.')
  const domainCore = parts.slice(0, -1).join('.')

  const domainWords = domainCore.split('.').map((w) => w.toLowerCase())

  const matches = []
  // eslint-disable-next-line no-restricted-syntax
  for (const word of domainWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i')
    const match = rawName.match(regex)
    if (match) {
      matches.push({ word: match[0], index: match.index })
    }
  }

  let finalName

  if (matches.length > 0) {
    matches.sort((a: any, b: any) => a.index - b.index)
    finalName = matches
      .map((m) => m.word)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  } else {
    finalName = rawName.trim()
  }

  return finalName
}

async function getDappName() {
  const og = ($('meta[property="og:site_name"]') as HTMLMetaElement)?.content?.trim()
  if (og) return og

  const manifestUrl = (document.querySelector('link[rel="manifest"]') as HTMLLinkElement)?.href
  if (manifestUrl) {
    try {
      const res = await fetch(manifestUrl)
      if (res.ok) {
        const json = await res.json()
        if (json.name) return String(json.name).trim()
        if (json.short_name) return String(json.short_name).trim()
      }
    } catch (e) {
      console.warn('Failed to get dApp name from manifest. Falling back to guessing it.', e)
    }
  }

  const rawName =
    document.title ||
    ($('head > meta[name="title"]') as HTMLMetaElement)?.content ||
    location.hostname ||
    location.origin

  try {
    return guessDappName(rawName)
  } catch (e) {
    console.warn('Failed to extract dApp name. Falling back to raw page title.', e)
  }

  return rawName
}

export class EthereumProvider extends EventEmitter {
  #pushEventHandlers: PushEventHandlers

  #requestPromise = new ReadyPromise(2)

  #dedupePromise = new DedupePromise([])

  #forwardRpcRequests?: (url: string, method: any, params: any) => Promise<any> | null

  #getFoundRpcUrls?: () => string[]

  chainId: string | null = null

  selectedAddress: string | null = null

  #dappProviderUrls: { [key: string]: string } = {}

  #configuredDappRpcUrls: string[] = []

  /**
   * The network ID of the currently connected Ethereum chain.
   * @deprecated
   */
  networkVersion: string | null = null

  isAmbire = true

  isMetaMask = true

  _isConnected = false

  _initialized = false

  _isUnlocked = false

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

  #requestId = 0

  #providerId: number

  get providerId() {
    return this.#providerId
  }

  #backgroundMessenger: Messenger

  constructor(
    forwardRpcRequests?: (url: string, method: any, params: any) => Promise<any>,
    getFoundRpcUrls?: () => string[]
  ) {
    super()

    this.#backgroundMessenger = initializeMessenger({ connect: 'background' })

    this.#forwardRpcRequests = forwardRpcRequests
    this.#getFoundRpcUrls = getFoundRpcUrls

    this.setMaxListeners(100)
    this.initialize()
    this.shimLegacy()
    this.#pushEventHandlers = new PushEventHandlers(this)
    this.#backgroundMessenger.reply(
      globalIsAmbireNext ? 'broadcast-next' : 'broadcast',
      this.#handleBackgroundMessage
    )
    this.#providerId = Date.now()
  }

  initialize = async () => {
    if (isCrossOriginFrame() || isTooDeepFrameInTheFrameHierarchy()) return
    document.addEventListener('visibilitychange', this.#requestPromiseCheckVisibility)

    const id = this.#requestId++
    domReadyCall(async () => {
      const params = {
        icon: await getIconWithRetry(),
        name: await getDappName(),
        origin: location.origin,
        href: location.href
      }

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      providerRequestTransport.send(
        { id, providerId: this.#providerId, method: 'tabCheckin', params },
        { id }
      )

      this.#requestPromise.check(2)
    })

    try {
      const { chainId, accounts, networkVersion, isUnlocked, logLevel }: any =
        await this.requestInternalMethods({ method: 'getProviderState' })

      this.setLogLevel(logLevel)
      if (isUnlocked) {
        this._isUnlocked = true
        this._state.isUnlocked = true
      }
      this.chainId = chainId
      this.networkVersion = networkVersion
      this.emit('connect', { chainId })
      this.#pushEventHandlers.chainChanged({
        chain: chainId,
        networkVersion
      })

      this.#pushEventHandlers.accountsChanged(accounts)
    } catch {
      //
    } finally {
      this._initialized = true
      this._state.initialized = true
      this.emit('_initialized')
    }
  }

  #requestPromiseCheckVisibility = () => {
    if (document.visibilityState === 'visible') {
      this.#requestPromise.check(1)
    } else {
      this.#requestPromise.uncheck(1)
    }
  }

  #handleBackgroundMessage = async ({ event, data }: any) => {
    if (isCrossOriginFrame() || isTooDeepFrameInTheFrameHierarchy()) return

    if (event === 'tabCheckin') {
      const id = this.#requestId++
      const params = {
        icon: await getIconWithRetry(),
        name: await getDappName(),
        origin: location.origin,
        href: location.href
      }

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      providerRequestTransport.send(
        { id, providerId: this.#providerId, method: 'tabCheckin', params },
        { id }
      )

      return
    }

    if (event === 'setProviderState') {
      try {
        const { chainId, accounts, networkVersion, isUnlocked }: any = data

        if (isUnlocked) {
          this._isUnlocked = true
          this._state.isUnlocked = true
        }
        this.chainId = chainId
        this.networkVersion = networkVersion
        this.emit('connect', { chainId })
        this.#pushEventHandlers.chainChanged({ chain: chainId, networkVersion })
        this.#pushEventHandlers.accountsChanged(accounts)
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }

    if ((this.#pushEventHandlers as any)[event]) {
      return (this.#pushEventHandlers as any)[event](data)
    }

    this.emit(event, data)
  }

  isConnected = () => {
    return true
  }

  // TODO: support multi request!
  request = async (data) => {
    return this.#dedupePromise.call(data.method, () => this._request(data))
  }

  _request = async (data) => {
    if (!data) {
      throw ethErrors.rpc.invalidRequest()
    }

    this.#requestPromiseCheckVisibility()

    // store in the EthereumProvider state the valid RPC URLs of the connected dapp to use them for forwarding
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      if (!this.#forwardRpcRequests || !this.#getFoundRpcUrls) return

      // eslint-disable-next-line no-restricted-syntax
      for (const url of this.#getFoundRpcUrls().filter((u) => !u.startsWith('wss'))) {
        if (
          !Object.values(this.#dappProviderUrls).find((u) => u === url) &&
          !this.#configuredDappRpcUrls.includes(url)
        ) {
          try {
            // Here we validate whether the provided URL is a valid RPC by getting the chainId of the provider
            // eslint-disable-next-line no-await-in-loop
            const chainId = await this.#forwardRpcRequests(url, 'eth_chainId', [])
            if (chainId) this.#dappProviderUrls[Number(chainId).toString()] = url
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error)
          }
          this.#configuredDappRpcUrls.push(url)
        }
      }
    })()

    return this.#requestPromise.call(async () => {
      if (
        data.method.startsWith('eth_') &&
        !ETH_RPC_METHODS_AMBIRE_MUST_HANDLE.includes(data.method)
      ) {
        const providerUrl = this.#dappProviderUrls[Number(this.chainId).toString()]
        if (providerUrl && this.#forwardRpcRequests) {
          if (data.method !== 'eth_call') {
            logInfoWithPrefix('[⏩ forwarded request]', data)
          }
          try {
            const result = await Promise.race([
              this.#forwardRpcRequests(providerUrl, data.method, data.params),
              // Timeouts after 3 secs because sometimes the provider call hangs with no response
              delayPromise(3000)
            ])

            if (data.method !== 'eth_call')
              logInfoWithPrefix('[⏩ forwarded request: success]', data.method, result)

            // Otherwise, if no result comes, do not return, fallback to our provider.
            if (result) return result
          } catch (err) {
            // We disregard any errors here since we'll handle the request with our provider regardless of the error
            if (data.method !== 'eth_call')
              logWarnWithPrefix('[⏩ forwarded request: error]', data.method, err)
          }
        }
      }

      if (data.method !== 'eth_call') {
        logInfoWithPrefix('[request]', data)
      }

      const id = this.#requestId++
      const response = await providerRequestTransport.send(
        {
          id,
          providerId: this.#providerId,
          method: data.method,
          params: data.params
        },
        { id }
      )

      if (response.id !== id) return
      if (response.error) {
        const error =
          (response.error as any)?.code && response.error?.message
            ? response.error
            : serializeError(response.error)

        if (data.method !== 'eth_call') {
          logInfoWithPrefix('[request: error]', data.method, error)
        }

        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw error
      }

      logInfoWithPrefix('[request: success]', data.method, response.result)
      return response.result
    })
  }

  requestInternalMethods = (data) => {
    return this.#dedupePromise.call(data.method, () => this._request(data))
  }

  // shim to MetaMask legacy api
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
    const { method, params, ...rest } = payload
    this.request({ method, params })
      .then((result) => callback(null, { ...rest, method, result }))
      .catch((error) => callback(error, { ...rest, method, error }))
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

    // eslint-disable-next-line @typescript-eslint/naming-convention, no-restricted-syntax
    for (const [_method, method] of legacyMethods) {
      this[_method] = () => this.request({ method })
    }
  }

  on = (event: string | symbol, handler: (...args: any[]) => void) => {
    return super.on(event, handler)
  }

  setLogLevel = (nextLogLevel: LOG_LEVELS) => {
    logger.setLevel(nextLogLevel)
  }
}
