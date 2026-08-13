/* eslint-disable @typescript-eslint/no-require-imports */
// Metro replaces viem's own `utils/address/getAddress` module with this one (see
// metro.config.js), so viem's internals get the native checksum too, not just
// direct callers.
//
// viem's `checksumAddress` keccaks the address, splits it into 40 characters,
// upper-cases half of them and joins them back. Profiling a portfolio reload on
// a large account measured ~0.5ms per call and ~2,250 calls — roughly 1.2s, from
// `mergeERC721s` and the erc20 hint loop checksumming every discovered address.
// viem already caches the result, so every one of those calls is a cache miss by
// definition and the only lever left is making the cold call cheaper.
//
// The whole function goes to Rust rather than just the hash, so the string
// splitting and rejoining crosses the FFI boundary once instead of running in
// Hermes.

import { nativeCrypto } from '@mobile/services/nativeCrypto/nativeCrypto'

type ChecksumAddress = (address: string, chainId?: number) => string
type IsAddress = (address: string, options?: { strict?: boolean }) => boolean

// The implementations this replaces, reached through the `@viem-original/*`
// specifiers that metro.config.js maps back to the real files, which is what
// keeps the fallbacks from resolving to this shim again.
const { checksumAddress: viemChecksumAddress, getAddress: viemGetAddress } =
  require('@viem-original/getAddress') as {
    checksumAddress: ChecksumAddress
    getAddress: ChecksumAddress
  }
// viem's `isAddress` imports this module back, so only the namespace is held
// here and the function is read at call time, once both sides have finished
// evaluating.
const isAddressModule = require('@viem-original/isAddress') as { isAddress: IsAddress }
const { LruMap } = require('@viem-original/lru') as {
  LruMap: new (size: number) => Map<string, string>
}

// Same size viem uses for its own checksum cache.
const CHECKSUM_CACHE_SIZE = 8192
const checksumCache = new LruMap(CHECKSUM_CACHE_SIZE)

/**
 * True when viem's own algorithm is well defined for this input, which is the
 * only case the native path may take.
 *
 * viem strips the prefix with an unconditional `substring(2)`, so an address
 * passed without `0x` loses its first two hex characters and checksums to a
 * 38-character string. Rust parses that same input correctly, which would be a
 * behaviour change rather than a speed-up, so anything viem does not recognise
 * as a plain `0x` address stays on viem.
 */
function isNativelyChecksummable(address: string, chainId?: number): boolean {
  // The EIP-1191 variant stays on viem's implementation, which has its own
  // cache, so there is no second copy of that rule to keep in sync.
  if (chainId !== undefined) return false

  return isAddressModule.isAddress(address, { strict: false })
}

function nativeChecksumAddress(address: string): string {
  if (!nativeCrypto) return viemChecksumAddress(address)

  const cached = checksumCache.get(address)
  if (cached !== undefined) return cached

  let checksummed: string
  try {
    checksummed = nativeCrypto.checksumAddress(address)
  } catch {
    // Rust rejects what it cannot parse. viem does not, so anything it refuses
    // has to fall through and produce viem's result.
    return viemChecksumAddress(address)
  }

  checksumCache.set(address, checksummed)

  return checksummed
}

/**
 * EIP-55 checksummed form of an address, matching viem's `checksumAddress`.
 * Like viem's, this validates nothing — an address that fails to parse comes
 * back exactly as viem would render it rather than throwing.
 */
export function checksumAddress(address: string, chainId?: number): string {
  if (!isNativelyChecksummable(address, chainId)) return viemChecksumAddress(address, chainId)

  return nativeChecksumAddress(address)
}

/**
 * Checksummed address, matching viem's `getAddress`. Throws viem's
 * `InvalidAddressError` for anything that is not a 20-byte hex address.
 */
export function getAddress(address: string, chainId?: number): string {
  // Delegated rather than re-thrown here so the error keeps viem's own type and
  // message. This also covers every input the native path must not take, so the
  // check below only has to rule out EIP-1191.
  if (!isAddressModule.isAddress(address, { strict: false }))
    return viemGetAddress(address, chainId)

  if (chainId !== undefined) return viemChecksumAddress(address, chainId)

  return nativeChecksumAddress(address)
}
