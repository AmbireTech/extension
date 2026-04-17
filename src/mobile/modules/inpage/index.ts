/**
 * Mobile Inpage Provider — Entry Point
 *
 * This is the webpack entry point that gets bundled into `inpage-bundle.json`.
 * It creates the EthereumProvider, installs it on window.ethereum,
 * and sets up the nonce-namespaced response callbacks.
 */
import { EthereumProvider, onResponse } from './EthereumProvider'

declare const AMBIRE_PROVIDER_NONCE: string

// ── Create provider instance ──
const provider = new EthereumProvider()

// ── Install response callback namespace ──
// RN calls: window.__ambire_<nonce>._onResponse(id, result, error)
// Security: non-configurable, non-writable, non-enumerable
const callbackNamespace = `__ambire_${AMBIRE_PROVIDER_NONCE}`

Object.defineProperty(window, callbackNamespace, {
  value: Object.freeze({
    _onResponse(id: number, result: any, error: any) {
      onResponse(id, result, error)
    },
    _onEvent(event: string, data: any) {
      provider.handleEvent(event, data)
    },
    _setProviderState(state: any) {
      provider.setProviderState(state)
    }
  }),
  configurable: false,
  writable: false,
  enumerable: false
})

// ── Install window.ambire ──
;(window as any).ambire = provider

// ── Install window.ethereum (non-configurable, with getter proxy) ──
const desc = Object.getOwnPropertyDescriptor(window, 'ethereum')
if (!desc || desc.configurable) {
  Object.defineProperty(window, 'ethereum', {
    configurable: false,
    enumerable: true,
    get: () => provider,
    set: () => {} // prevent dapps from overwriting
  })
}

// ── Legacy web3 ──
if (!(window as any).web3) (window as any).web3 = { currentProvider: provider }

// ── Signal to dapps that the provider is ready ──
window.dispatchEvent(new Event('ethereum#initialized'))

// ── Request initial provider state ──
// This is the mobile equivalent of contentScriptReady + getProviderState
provider
  .request({ method: 'getProviderState' })
  .then((state: any) => {
    if (state) provider.setProviderState(state)
  })
  .catch(() => {
    // silently fail — provider will still work, just without initial state
  })
