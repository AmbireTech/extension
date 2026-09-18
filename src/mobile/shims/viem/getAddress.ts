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

// The implementations this replaces, reached through the `@viem-original/*`
// specifiers that metro.config.js maps back to the real files, which is what
// keeps the fallbacks from resolving to this shim again.
const { checksumAddress: viemChecksumAddress, getAddress: viemGetAddress } =
  require('@viem-original/getAddress') as {
    checksumAddress: ChecksumAddress
    getAddress: ChecksumAddress
  }
const { LruMap } = require('@viem-original/lru') as {
  LruMap: new (size: number) => Map<string, string>
}
const { InvalidAddressError } = require('@viem-original/address') as {
  InvalidAddressError: new (args: { address: string }) => Error
}

// Same size viem uses for its own checksum cache.
const CHECKSUM_CACHE_SIZE = 8192
const checksumCache = new LruMap(CHECKSUM_CACHE_SIZE)

/**
 * EIP-55 checksum from Rust, or null when Rust refused the address. Rust accepts
 * exactly what viem's `isAddress` accepts, so a null is viem's own verdict on
 * the address rather than a failure of the native side.
 *
 * Only call this with `nativeCrypto` present. Without it every address is a
 * null, and a valid one becomes indistinguishable from a refused one.
 */
function nativeChecksumAddress(address: string): string | null {
  const cached = checksumCache.get(address)
  if (cached !== undefined) return cached

  let checksummed: string
  try {
    checksummed = nativeCrypto!.checksumAddress(address)
  } catch {
    return null
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
  // The EIP-1191 variant is not something Rust refuses, it is something Rust
  // answers with the plain EIP-55 form, so it has to be gated rather than
  // caught.
  if (chainId !== undefined || !nativeCrypto) return viemChecksumAddress(address, chainId)

  // viem checksums an unparseable address rather than rejecting it, dropping the
  // first two characters of anything without a `0x`, so a refusal has to come
  // back with that reading instead of throwing.
  return nativeChecksumAddress(address) ?? viemChecksumAddress(address)
}

/**
 * Checksummed address, matching viem's `getAddress`. Throws viem's
 * `InvalidAddressError` for anything that is not a 20-byte hex address.
 */
export function getAddress(address: string, chainId?: number): string {
  if (chainId !== undefined || !nativeCrypto) return viemGetAddress(address, chainId)

  const checksummed = nativeChecksumAddress(address)
  // Rust refuses exactly the addresses viem raises this error for, so throwing
  // it here is viem's verdict with viem's error, not a native one leaking out.
  if (checksummed === null) throw new InvalidAddressError({ address })

  return checksummed
}
