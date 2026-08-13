/* eslint-disable @typescript-eslint/no-require-imports */
// Metro replaces ethers' own `utils/data` module with this one (see
// metro.config.js). ethers converts between hex strings and bytes with a
// `substring` + `parseInt` per byte and a validation regex per call, and builds
// hex with two single-char lookups and two concatenations per byte. Profiling a
// portfolio reload put `hexlify` and `_getBytes` at ~1.15s, mostly from the
// JSON-RPC layer hexlifying every request field and re-encoding every body.
//
// Three things replace those loops here, cheapest first:
//
//   - `hexlify` of a string that is already valid hex is a case fold, so it
//     skips parsing to bytes and rebuilding the hex altogether. ethers pays the
//     full round trip, and the deployless calldata passes through `copyRequest`
//     and `getRpcTransaction` on the way to every `eth_call`.
//   - At or below `NATIVE_HEX_MIN_BYTES` the loops go to viem, which already
//     does them the fast way: a 256-entry byte-to-hex table, and charCode
//     arithmetic instead of a string allocation per byte.
//   - Above it they go to the Rust crate, whose hex codec is SIMD accelerated.
//     The threshold is what keeps that from being a pessimisation: a uniffi call
//     costs three JSI crossings and two memcpys no matter how small the payload,
//     which swamps the loop for the 20-32 byte values that dominate by count.
//     A BalanceGetter call for a few hundred tokens encodes to ~16KB, which is
//     the shape of payload the native path exists for.
//
// Everything else in the module is reimplemented rather than wrapped, because
// `concat`, `dataSlice` and the padders call `getBytes`/`hexlify` through the
// module's own local bindings, which a wrapper could not reach.

import type { BytesLike } from 'ethers'

import { nativeCrypto } from '@mobile/services/nativeCrypto/nativeCrypto'

const { bytesToHex: viemBytesToHex } = require('@viem-original/toHex') as {
  bytesToHex: (value: Uint8Array) => string
}
const { hexToBytes: viemHexToBytes } = require('@viem-original/toBytes') as {
  hexToBytes: (hex: string) => Uint8Array
}
// Same build of ethers the shimmed module belongs to, so the thrown errors keep
// the identity that ethers' own `isError` checks rely on. Typed as plain
// functions rather than with ethers' assertion signatures, which TypeScript only
// accepts on explicitly annotated declarations.
const { assert, assertArgument } = require('@ethers-original/errors') as {
  assert: (check: boolean, message: string, code: string, info?: any) => void
  assertArgument: (check: boolean, message: string, name: string, value: any) => never
}

const HEX_PREFIX = '0x'
const CHAR_CODE = { zero: 48, nine: 57, upperA: 65, upperF: 70, lowerA: 97, lowerF: 102 }

/** Payload size from which crossing into Rust beats looping in JS. */
const NATIVE_HEX_MIN_BYTES = 5 * 1024

/**
 * True when everything from `start` onwards is a hex digit.
 *
 * The range tests are written out inside the loop rather than called as a
 * predicate. Hermes does not inline across the call, and this runs once per
 * character of a ~32KB string on the way to every `eth_call`, where the call
 * frame cost measured larger than the comparisons it wrapped.
 */
function hasOnlyHexDigits(value: string, start: number): boolean {
  for (let i = start; i < value.length; i += 1) {
    const code = value.charCodeAt(i)

    if (
      (code < CHAR_CODE.zero || code > CHAR_CODE.nine) &&
      (code < CHAR_CODE.lowerA || code > CHAR_CODE.lowerF) &&
      (code < CHAR_CODE.upperA || code > CHAR_CODE.upperF)
    ) {
      return false
    }
  }

  return true
}

/** Replaces ethers' `/^0x[0-9A-Fa-f]*$/` test without building a regex match. */
function isHexWithPrefix(value: string): boolean {
  if (!value.startsWith(HEX_PREFIX)) return false

  return hasOnlyHexDigits(value, HEX_PREFIX.length)
}

/**
 * True for a `0x` string holding whole bytes. viem's `hexToBytes` left-pads an
 * odd-length string and assumes the prefix, both of which ethers rejects, so
 * this guards the call rather than trusting it.
 *
 * The prefix is matched case-insensitively because the regex ethers uses here
 * carries the `i` flag, which makes `0X12` valid — unlike `isHexString`, whose
 * regex has no flag and rejects it.
 */
function isByteAlignedHex(value: string): boolean {
  if (value.length % 2 !== 0 || value.length < HEX_PREFIX.length) return false
  if (value[0] !== '0' || (value[1] !== 'x' && value[1] !== 'X')) return false

  return true
}

/**
 * The exact bytes as a standalone ArrayBuffer. uniffi's converter reads the
 * whole buffer, so a Uint8Array that is a window onto a larger one has to be
 * copied instead of passed along by its `buffer`.
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  // Hermes has no SharedArrayBuffer, so the backing store is always an
  // ArrayBuffer despite what the ArrayBufferLike type allows.
  const buffer = bytes.buffer as ArrayBuffer

  if (bytes.byteOffset === 0 && bytes.byteLength === buffer.byteLength) return buffer

  return buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

function bytesToHex(bytes: Uint8Array): string {
  if (bytes.length > NATIVE_HEX_MIN_BYTES && nativeCrypto) {
    try {
      return nativeCrypto.bytesToHex(toArrayBuffer(bytes))
    } catch {
      // Only a broken native side can land here, since Rust encodes any bytes it
      // is given. Falling through keeps viem the single source of truth for what
      // this module returns, and leaves the failure out of Sentry on purpose:
      // this is a per-call hot path and a broken crate would report thousands of
      // identical events.
    }
  }

  return viemBytesToHex(bytes)
}

/**
 * Bytes of a string that already passed `isByteAlignedHex`. Throws for a
 * non-hex character, which is the remaining half of the validation ethers does
 * up front with a regex.
 */
function hexToBytes(value: string): Uint8Array {
  const byteLength = (value.length - HEX_PREFIX.length) / 2

  if (byteLength > NATIVE_HEX_MIN_BYTES && nativeCrypto) {
    try {
      return new Uint8Array(nativeCrypto.hexToBytes(value))
    } catch {
      // Rust rejects what it cannot parse and so does viem, so the input is
      // handed on rather than reported here. That keeps viem deciding what
      // counts as valid, and the native path able only to be faster.
    }
  }

  return viemHexToBytes(value)
}

function _getBytes(value: BytesLike, name?: string, copy?: boolean): Uint8Array {
  if (value instanceof Uint8Array) {
    // ethers hands back the very same array unless a copy is asked for, and
    // callers depend on that aliasing.
    if (copy) return new Uint8Array(value)
    return value
  }

  if (typeof value === 'string' && isByteAlignedHex(value)) {
    try {
      return hexToBytes(value)
    } catch {
      // Reported below as ethers reports it.
    }
  }

  return assertArgument(false, 'invalid BytesLike value', name || 'value', value)
}

export function getBytes(value: BytesLike, name?: string): Uint8Array {
  return _getBytes(value, name, false)
}

export function getBytesCopy(value: BytesLike, name?: string): Uint8Array {
  return _getBytes(value, name, true)
}

export function isHexString(value: any, length?: number | boolean): boolean {
  if (typeof value !== 'string' || !isHexWithPrefix(value)) return false
  if (typeof length === 'number' && value.length !== 2 + 2 * length) return false
  if (length === true && value.length % 2 !== 0) return false

  return true
}

export function isBytesLike(value: any): boolean {
  return isHexString(value, true) || value instanceof Uint8Array
}

export function hexlify(data: BytesLike): string {
  // ethers parses a hex string into bytes and then rebuilds the hex from them,
  // which for an already-valid string only lowercases it. An invalid one falls
  // through so `getBytes` reports it exactly as ethers does.
  if (
    typeof data === 'string' &&
    isByteAlignedHex(data) &&
    hasOnlyHexDigits(data, HEX_PREFIX.length)
  ) {
    return data.toLowerCase()
  }

  return bytesToHex(getBytes(data))
}

export function concat(datas: ReadonlyArray<BytesLike>): string {
  return HEX_PREFIX + datas.map((d) => hexlify(d).substring(2)).join('')
}

export function dataLength(data: BytesLike): number {
  if (isHexString(data, true)) return ((data as string).length - 2) / 2

  return getBytes(data).length
}

export function dataSlice(data: BytesLike, start?: number, end?: number): string {
  const bytes = getBytes(data)

  if (end != null && end > bytes.length) {
    assert(false, 'cannot slice beyond data bounds', 'BUFFER_OVERRUN', {
      buffer: bytes,
      length: bytes.length,
      offset: end
    })
  }

  return hexlify(bytes.slice(start == null ? 0 : start, end == null ? bytes.length : end))
}

export function stripZerosLeft(data: BytesLike): string {
  let bytes = hexlify(data).substring(2)
  while (bytes.startsWith('00')) {
    bytes = bytes.substring(2)
  }

  return HEX_PREFIX + bytes
}

function zeroPad(data: BytesLike, length: number, left: boolean): string {
  const bytes = getBytes(data)

  assert(length >= bytes.length, 'padding exceeds data length', 'BUFFER_OVERRUN', {
    buffer: new Uint8Array(bytes),
    length,
    offset: length + 1
  })

  const result = new Uint8Array(length)
  result.fill(0)
  if (left) {
    result.set(bytes, length - bytes.length)
  } else {
    result.set(bytes, 0)
  }

  return hexlify(result)
}

export function zeroPadValue(data: BytesLike, length: number): string {
  return zeroPad(data, length, true)
}

export function zeroPadBytes(data: BytesLike, length: number): string {
  return zeroPad(data, length, false)
}
