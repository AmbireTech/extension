/**
 * Mobile-specific exhaustive shim for eth-crypto.
 *
 * This shim implements lazy-loading for every single export of the eth-crypto package.
 * This ensures that none of the library's top-level code (which depends on specific
 * prototype behaviors that crash Hermes during initial evaluation) is executed
 * until a function is actually called.
 */

const getEthCrypto = () => require('eth-crypto')

// Lazy-loaded sub-objects using Proxies
const lazySubObject = (name: string) =>
  new Proxy(
    {},
    {
      get: (_target, prop) => getEthCrypto()[name][prop]
    }
  )

// Named Exports (Static declarations for bundler compatibility)
export const createIdentity = (...args: any[]) => getEthCrypto().createIdentity(...args)
export const publicKey = lazySubObject('publicKey')
export const publicKeyByPrivateKey = (...args: any[]) =>
  getEthCrypto().publicKeyByPrivateKey(...args)
export const sign = (...args: any[]) => getEthCrypto().sign(...args)
export const recover = (...args: any[]) => getEthCrypto().recover(...args)
export const recoverPublicKey = (...args: any[]) => getEthCrypto().recoverPublicKey(...args)
export const vrs = lazySubObject('vrs')
export const encryptWithPublicKey = (...args: any[]) => getEthCrypto().encryptWithPublicKey(...args)
export const decryptWithPrivateKey = (...args: any[]) =>
  getEthCrypto().decryptWithPrivateKey(...args)
export const cipher = lazySubObject('cipher')
export const signTransaction = (...args: any[]) => getEthCrypto().signTransaction(...args)
export const txDataByCompiled = (...args: any[]) => getEthCrypto().txDataByCompiled(...args)
export const calculateContractAddress = (...args: any[]) =>
  getEthCrypto().calculateContractAddress(...args)
export const hash = lazySubObject('hash')
export const util = lazySubObject('util')
export const hex = lazySubObject('hex')

// Default Export (A Proxy that redirects everything to the underlying library)
export default new Proxy(
  {},
  {
    get: (_target, prop) => getEthCrypto()[prop]
  }
) as any
