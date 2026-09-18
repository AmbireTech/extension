import { JsonRpcApiProviderOptions } from 'ethers'

import { Network as NetworkInterface } from '@ambire-common/interfaces/network'
import { RPCProvider } from '@ambire-common/interfaces/provider'

/**
 * Mobile replacement for ambire-common's Colibri provider, wired in by a Metro
 * resolver redirect (see metro.config.js).
 *
 * The Colibri verifier is a WebAssembly module and Hermes has no WebAssembly, so mobile cannot use
 * the real one. It has no verifier of its own yet, so this reports that instead of falling back to
 * an unverified RPC call, which would light up the verification badge without verifying anything.
 * VerificationController catches this and marks the chain as failed.
 */
export const getColibriRpcProvider = (
  _network: NetworkInterface,
  _options?: JsonRpcApiProviderOptions
): RPCProvider => {
  throw new Error('Colibri verification is not available on mobile yet')
}
