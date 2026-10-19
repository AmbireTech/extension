// Byte helpers for the device wire format and the UserOp builder. Device
// integers are big-endian unless a format says otherwise.

import { isHex } from 'viem'

/** Decode a hex string, with or without its `0x` prefix, into bytes. Throws
 *  on an odd length or a character that isn't hex, rather than decoding it
 *  to bytes nobody asked to sign. */
export function hexToBytes(h: string): Uint8Array {
  const body = h.startsWith('0x') || h.startsWith('0X') ? h.slice(2) : h
  if (body.length % 2) throw new Error('odd-length hex')
  if (!isHex(`0x${body}`, { strict: true })) throw new Error('not a hex string')
  const out = new Uint8Array(body.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(body.substring(i * 2, i * 2 + 2), 16)
  }
  return out
}

/** Lowercase hex of `b`, without a prefix. */
export function bytesToHex(b: Uint8Array): string {
  let out = ''
  for (let i = 0; i < b.length; i++) out += b[i]!.toString(16).padStart(2, '0')
  return out
}

/** Lowercase `0x`-prefixed hex of `b`. */
export function bytesToHex0x(b: Uint8Array): `0x${string}` {
  return `0x${bytesToHex(b)}`
}

/** The 20 bytes of a hex address. Throws when it isn't 20 bytes long. */
export function addressBytes(address: string): Uint8Array {
  const b = hexToBytes(address)
  if (b.length !== 20) throw new Error(`address must be 20 bytes, got ${b.length}`)
  return b
}

export function u16be(n: number): Uint8Array {
  return new Uint8Array([(n >> 8) & 0xff, n & 0xff])
}

export function u32be(n: number): Uint8Array {
  const v = n >>> 0
  return new Uint8Array([(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff])
}

export function u64be(n: bigint | number): Uint8Array {
  const bi = typeof n === 'bigint' ? n : BigInt(n)
  const buf = new Uint8Array(8)
  for (let i = 0; i < 8; i++) {
    buf[i] = Number((bi >> BigInt((7 - i) * 8)) & 0xffn)
  }
  return buf
}

export function u256be(n: bigint | number | string): Uint8Array {
  const bi = typeof n === 'bigint' ? n : BigInt(n)
  const buf = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    buf[31 - i] = Number((bi >> BigInt(i * 8)) & 0xffn)
  }
  return buf
}

export function readU16Be(b: Uint8Array, off: number): number {
  return (b[off]! << 8) | b[off + 1]!
}

export function readU32Be(b: Uint8Array, off: number): number {
  return (
    b[off]! * 0x01000000 + ((b[off + 1]! << 16) >>> 0) + ((b[off + 2]! << 8) >>> 0) + b[off + 3]!
  )
}

export function readU64Be(b: Uint8Array, off: number): bigint {
  let v = 0n
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[off + i]!)
  return v
}

/** Read `len` big-endian bytes at `off` as an unsigned integer (a u256 ABI
 *  word, for example). */
export function readUintBe(b: Uint8Array, off: number, len: number): bigint {
  let v = 0n
  for (let i = 0; i < len; i++) v = (v << 8n) | BigInt(b[off + i]!)
  return v
}

/** Concatenate byte arrays. */
export function concatBytes(chunks: Uint8Array[]): Uint8Array {
  let total = 0
  for (const c of chunks) total += c.length
  const out = new Uint8Array(total)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.length
  }
  return out
}

/** Byte-for-byte equality. */
export function isSameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/** Read a 32-byte ABI word as a u32, requiring all bits above u32 to be
 *  zero. Returns null on high bits — callers (the Safe byte-parsers that
 *  mirror firmware acceptance rules) map that to the firmware's
 *  corresponding malformed-calldata refusal. */
export function readU32Word(buf: Uint8Array, off: number): number | null {
  for (let i = 0; i < 28; i++) if (buf[off + i] !== 0) return null
  return (
    buf[off + 28]! * 0x1000000 + buf[off + 29]! * 0x10000 + buf[off + 30]! * 0x100 + buf[off + 31]!
  )
}

/** The address in a canonical 32-byte ABI address word at `off` (12 zero
 *  bytes, then the address), or null when the word is out of range or not
 *  canonical. */
export function readAddressWord(buf: Uint8Array, off: number): Uint8Array | null {
  if (off < 0 || off + 32 > buf.length) return null
  for (let i = 0; i < 12; i++) if (buf[off + i] !== 0) return null
  return buf.subarray(off + 12, off + 32)
}

/** Does `data` start with the 4-byte function `selector`? The one shared
 *  matcher for every calldata parser in this lib — the byte-parsers mirror
 *  firmware acceptance rules, so a single implementation keeps host and
 *  device from disagreeing about which calldata matches. */
export function selectorMatches(data: Uint8Array, selector: Uint8Array): boolean {
  if (data.length < selector.length) return false
  for (let i = 0; i < selector.length; i++) {
    if (data[i] !== selector[i]) return false
  }
  return true
}
