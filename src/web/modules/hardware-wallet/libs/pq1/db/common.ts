// What the four clear-signing catalogs in `public/pq1` share (ERC-20
// metadata, address names, function names, ERC-7730 descriptors): a 32-byte
// little-endian header, an entry table, a string or IR pool, a section of
// Merkle proofs, and a loader that fetches each blob once.
//
// The device holds only each catalog's Merkle root. Ambire sends it one
// entry and that entry's proof per lookup, and the device checks the proof
// against its root, so a forged entry can't pass. A missing one makes the
// device show less (a raw address, amount or function selector), or refuse
// a call it knows needs the entry.

import { captureException } from '@common/config/analytics/CrashAnalytics.web'
import { browser, isExtension } from '@web/constants/browserapi'

import { isSameBytes } from '../transport/bytes'

/** Record that a clear-signing lookup failed and the request will go out
 *  without its metadata: the device then shows less, or refuses a call it
 *  knows needs it. A catalog that stops loading would quietly downgrade
 *  every PQ1 user to blind signing, so it is reported to Sentry as well as
 *  logged. */
export function reportClearSigningFallback(what: string, e: unknown): void {
  console.warn(`[pq1] ${what}`, e)
  captureException(e, { extra: { pq1ClearSigningFallback: what } })
}

export const DB_HEADER_LEN = 32
const SUPPORTED_VERSION = 1

// ── Little-endian readers/writers (blob integers are LE) ────────────

export function readU32Le(b: Uint8Array, off: number): number {
  return (
    (b[off]! |
      ((b[off + 1]! << 8) >>> 0) |
      ((b[off + 2]! << 16) >>> 0) |
      ((b[off + 3]! << 24) >>> 0)) >>>
    0
  )
}

export function readU64Le(b: Uint8Array, off: number): bigint {
  let v = 0n
  for (let i = 7; i >= 0; i--) v = (v << 8n) | BigInt(b[off + i]!)
  return v
}

export function writeU32Le(b: Uint8Array, off: number, v: number): void {
  b[off] = v & 0xff
  b[off + 1] = (v >>> 8) & 0xff
  b[off + 2] = (v >>> 16) & 0xff
  b[off + 3] = (v >>> 24) & 0xff
}

export function writeU64Le(b: Uint8Array, off: number, v: bigint): void {
  let x = v
  for (let i = 0; i < 8; i++) {
    b[off + i] = Number(x & 0xffn)
    x >>= 8n
  }
}

// ── Header ──────────────────────────────────────────────────────────

/** The common subset of the 32-byte DB header. The ERC-7730 catalog's
 *  extra fields (`flags` at 8, `ir_pool_size` at 20) are read separately
 *  by its parser; `poolOff` is its `ir_pool_off`. */
export interface DbHeader {
  version: number
  entryCnt: number
  poolOff: number
  proofDepth: number
  proofsOff: number
}

/** Parse + validate the common header: magic, supported version, sane
 *  proof depth. `label` prefixes every error (e.g. 'erc20 db'). */
export function parseDbHeader(
  blob: Uint8Array,
  magic: Uint8Array,
  magicName: string,
  label: string
): DbHeader {
  if (blob.length < DB_HEADER_LEN) {
    throw new Error(`${label} too short: ${blob.length} < ${DB_HEADER_LEN}`)
  }
  if (!isSameBytes(blob.subarray(0, 4), magic)) {
    throw new Error(`${label}: bad magic (expected ${magicName})`)
  }
  const header: DbHeader = {
    version: readU32Le(blob, 4),
    entryCnt: readU32Le(blob, 12),
    poolOff: readU32Le(blob, 16),
    proofDepth: readU32Le(blob, 24),
    proofsOff: readU32Le(blob, 28)
  }
  if (header.version !== SUPPORTED_VERSION) {
    throw new Error(`${label}: unsupported version ${header.version}`)
  }
  if (header.proofDepth === 0 || header.proofDepth > 32) {
    throw new Error(`${label}: bad proof_depth ${header.proofDepth}`)
  }
  return header
}

/** The entry table and the proofs section must fit inside the blob —
 *  checked once at parse time so per-lookup reads can't run off the end. */
export function checkDbSections(
  blob: Uint8Array,
  header: DbHeader,
  entryLen: number,
  label: string
): void {
  const entriesEnd = DB_HEADER_LEN + header.entryCnt * entryLen
  if (entriesEnd > blob.length) {
    throw new Error(`${label}: truncated entry table (need ${entriesEnd} B, have ${blob.length})`)
  }
  const proofsEnd = header.proofsOff + header.entryCnt * header.proofDepth * 32
  if (proofsEnd > blob.length) {
    throw new Error(`${label}: truncated proofs section (need ${proofsEnd} B, have ${blob.length})`)
  }
}

// ── Pool accessors ──────────────────────────────────────────────────

/** `[u8 len][len bytes]` string at `at` in the string pool. */
export function readPoolString(blob: Uint8Array, at: number, label: string): Uint8Array {
  if (at >= blob.length) throw new Error(`${label}: pool string offset out of range`)
  const n = blob[at]!
  const start = at + 1
  const end = start + n
  if (end > blob.length) throw new Error(`${label}: pool string slice out of range`)
  return blob.subarray(start, end)
}

/** The `proof_depth * 32`-byte Merkle proof for `leafIndex`. */
export function readProof(
  blob: Uint8Array,
  header: DbHeader,
  leafIndex: number,
  label: string
): Uint8Array {
  const span = header.proofDepth * 32
  const base = header.proofsOff + leafIndex * span
  const end = base + span
  if (end > blob.length) {
    throw new Error(`${label}: proof slice out of range for leaf ${leafIndex}`)
  }
  return blob.subarray(base, end)
}

// ── Binary search over a sorted fixed-width entry table ─────────────

/** Leftmost row whose key equals the probe, or -1. `compare(rowIdx)`
 *  must return the row's ordering relative to the probe (<0 row-before,
 *  0 match, >0 row-after) against the table's sort order. Lower-bound
 *  semantics keep the first of any duplicate rows. */
export function findSortedEntry(entryCnt: number, compare: (rowIdx: number) => number): number {
  let lo = 0
  let hi = entryCnt
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (compare(mid) < 0) lo = mid + 1
    else hi = mid
  }
  return lo < entryCnt && compare(lo) === 0 ? lo : -1
}

// ── Single-flight loader ────────────────────────────────────────────

/** Build a load-once function for a catalog shipped in the extension's
 *  assets. Resolves to the same parsed object on every later call; a failed
 *  load can be retried by the next call. Throws on a fetch, header or size
 *  problem — callers report it (`reportClearSigningFallback`) and send the
 *  request without that bundle. */
export function createDbLoader<T>(url: string, parse: (blob: Uint8Array) => T): () => Promise<T> {
  let cached: T | null = null
  let loading: Promise<T> | null = null

  return async () => {
    if (cached) return cached
    if (loading) return loading

    loading = (async () => {
      // Outside an extension context (tests, isolated builds): fall back to
      // the relative path and let fetch decide.
      const resolvedUrl = isExtension ? browser.runtime.getURL(url) : url
      const resp = await fetch(resolvedUrl)
      if (!resp.ok) throw new Error(`failed to load ${url} (${resp.status})`)
      const blob = new Uint8Array(await resp.arrayBuffer())
      const parsed = parse(blob)
      cached = parsed
      return parsed
    })()

    try {
      return await loading
    } finally {
      loading = null
    }
  }
}
