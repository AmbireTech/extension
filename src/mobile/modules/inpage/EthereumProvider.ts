/* eslint-disable no-restricted-globals */
import { EthereumProvider as CommonEthereumProvider } from '@common/modules/inpage/EthereumProvider'

const pendingRequests: Record<number, { resolve: (v: any) => void; reject: (e: any) => void }> = {}

export class EthereumProvider extends CommonEthereumProvider {
  constructor(
    forwardRpcRequests?: (url: string, method: any, params: any) => Promise<any>,
    getFoundRpcUrls?: () => string[],
    options?: { deferInitialization?: boolean }
  ) {
    const externalHandlers = {
      sendRequest: (data: any) => {
        return new Promise((resolve, reject) => {
          if (!(window as any).ReactNativeWebView?.postMessage) {
            // eslint-disable-next-line no-console
            console.error('[Ambire Provider] ReactNativeWebView.postMessage not available')
            return reject(new Error('ReactNativeWebView.postMessage not available'))
          }

          pendingRequests[data.id] = { resolve, reject }

          // eslint-disable-next-line no-param-reassign
          data.origin = location.origin
          // eslint-disable-next-line no-param-reassign
          data.href = location.href
          ;(window as any).ReactNativeWebView.postMessage(JSON.stringify(data))
        })
      },
      onBackgroundMessage: () => {
        // Mobile doesn't use the background messenger the same way as the extension.
        // Instead, it receives one-way events via the global window.__ambire_<nonce>._onEvent.
      },
      logInfo: (prefix: string, ...args: any[]) => {
        // eslint-disable-next-line no-console
        console.log(`[Ambire] ${prefix}`, ...args)
      },
      logWarn: (prefix: string, ...args: any[]) => {
        // eslint-disable-next-line no-console
        console.warn(`[Ambire] ${prefix}`, ...args)
      }
    }

    super(externalHandlers, forwardRpcRequests, getFoundRpcUrls, options)
  }

  // ── Handle push events from wallet ──
  handleEvent = (event: string, data: any): void => {
    switch (event) {
      case 'accountsChanged':
        if (data?.[0] !== this.selectedAddress) {
          this.selectedAddress = data?.[0] || null
          this._state.accounts = data
          if (this._initialized) this.emit('accountsChanged', data)
        }
        break

      case 'chainChanged':
        if (data.chain !== this.chainId) {
          this.chainId = data.chain
          if (this._initialized) this.emit('chainChanged', data.chain)
        }
        if (data.networkVersion !== this.networkVersion) {
          this.networkVersion = data.networkVersion
          if (this._initialized) this.emit('networkChanged', data.networkVersion)
        }
        this._isConnected = true
        this._state.isConnected = true
        this.emit('connect', { chainId: data.chain })
        break

      case 'connect':
        this._isConnected = true
        this._state.isConnected = true
        this.emit('connect', data)
        break

      case 'disconnect':
        this._isConnected = false
        this._state.isConnected = false
        this._state.accounts = null
        this.selectedAddress = null
        this.emit('accountsChanged', [])
        this.emit('disconnect', data)
        break

      case 'unlock':
        this._isUnlocked = true
        this._state.isUnlocked = true
        if (data) this.emit('accountsChanged', data)
        break

      case 'lock':
        this._isUnlocked = false
        this.emit('accountsChanged', [])
        break

      default:
        this.emit(event, data)
        break
    }
  }

  setProviderState = (state: {
    chainId?: string
    networkVersion?: string
    isUnlocked?: boolean
    accounts?: string[]
  }): void => {
    if (state.chainId) this.chainId = state.chainId
    if (state.networkVersion) this.networkVersion = state.networkVersion
    if (state.isUnlocked) {
      this._isUnlocked = true
      this._state.isUnlocked = true
    }
    if (state.accounts?.length) {
      this.selectedAddress = state.accounts[0]
      this._state.accounts = state.accounts
      this._isConnected = true
      this._state.isConnected = true
      this.emit('accountsChanged', state.accounts)
    }
    this.emit('connect', { chainId: state.chainId })
    this._initialized = true
    this._state.initialized = true
    this.emit('_initialized')
  }
}

/**
 * Resolve a pending RPC request (called by RN via injectJavaScript).
 */
export function onResponse(id: number, result: any, error: any): void {
  const pending = pendingRequests[id]
  if (!pending) return
  delete pendingRequests[id]
  if (error) {
    pending.reject(error)
  } else {
    // Return the full response object that the common consumer expects
    pending.resolve({ id, result })
  }
}
