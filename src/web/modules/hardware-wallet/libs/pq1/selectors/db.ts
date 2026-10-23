// The function-name catalog (`public/pq1/selectors_db.bin`): text
// signatures of well-known functions, so the device can name a call it has
// no other decoder for (e.g. `safeTransferFrom(address,address,uint256)`)
// instead of showing only the 4-byte selector. The device checks every
// bundle against the catalog's Merkle root (see `db/common.ts`) and that its
// selector is the call's, and decodes the arguments of the signatures it
// knows.
//
// Bundle layout:
//
//   selector      [u8; 4]
//   text_sig_len  u8          (1..=63)
//   text_sig      [u8; text_sig_len]   printable ASCII
//   leaf_index    u32 LE
//   proof_depth   u32 LE      (<= 32)
//   proof         [u8; proof_depth * 32]

import { SELECTOR_BUNDLE_MAX_LEN } from '../config'
import {
  checkDbSections,
  createDbLoader,
  DB_HEADER_LEN,
  findSortedEntry,
  parseDbHeader,
  readPoolString,
  readProof,
  readU32Le,
  writeU32Le,
  type DbHeader
} from '../db/common'

const SELECTORS_DB_URL = 'pq1/selectors_db.bin'

const HEADER_MAGIC = new Uint8Array([0x53, 0x45, 0x4c, 0x34]) // "SEL4"
const LABEL = 'selectors db'

// Entry table: 8 bytes per row, sorted by selector.
const ENTRY_LEN = 8
const ENTRY_OFF_TEXT_OFF = 4 // u32 LE (offset into the string pool)
const SELECTOR_LEN = 4

/** Longest text signature the device accepts. */
const TEXT_SIG_MAX_LEN = 63

class SelectorsDb {
  constructor(
    private readonly blob: Uint8Array,
    readonly header: DbHeader
  ) {}

  #findRow(selector: Uint8Array): number {
    return findSortedEntry(this.header.entryCnt, (row) => {
      const base = DB_HEADER_LEN + row * ENTRY_LEN
      for (let j = 0; j < SELECTOR_LEN; j++) {
        const a = this.blob[base + j]!
        const b = selector[j]!
        if (a !== b) return a < b ? -1 : 1
      }
      return 0
    })
  }

  #text(row: number): Uint8Array {
    const base = DB_HEADER_LEN + row * ENTRY_LEN
    return readPoolString(
      this.blob,
      this.header.poolOff + readU32Le(this.blob, base + ENTRY_OFF_TEXT_OFF),
      LABEL
    )
  }

  /** Build the curated selector bundle for the first 4 bytes of `calldata`,
   *  or null when the calldata is shorter than a selector or the selector
   *  isn't in the DB. */
  buildBundle(calldata: Uint8Array): Uint8Array | null {
    if (calldata.length < SELECTOR_LEN) return null
    const selector = calldata.subarray(0, SELECTOR_LEN)
    const leafIndex = this.#findRow(selector)
    if (leafIndex < 0) return null
    const text = this.#text(leafIndex)
    if (text.length === 0 || text.length > TEXT_SIG_MAX_LEN) {
      throw new Error(`${LABEL}: text signature of leaf ${leafIndex} has length ${text.length}`)
    }
    const proof = readProof(this.blob, this.header, leafIndex, LABEL)

    const bundleLen = SELECTOR_LEN + 1 + text.length + 4 + 4 + proof.length
    if (bundleLen > SELECTOR_BUNDLE_MAX_LEN) {
      throw new Error(`${LABEL}: bundle of leaf ${leafIndex} is ${bundleLen} B`)
    }
    const out = new Uint8Array(bundleLen)
    let p = 0
    out.set(selector, p)
    p += SELECTOR_LEN
    out[p++] = text.length
    out.set(text, p)
    p += text.length
    writeU32Le(out, p, leafIndex)
    p += 4
    writeU32Le(out, p, this.header.proofDepth)
    p += 4
    out.set(proof, p)
    return out
  }
}

export function parseSelectorsDb(blob: Uint8Array): SelectorsDb {
  const header = parseDbHeader(blob, HEADER_MAGIC, 'SEL4', LABEL)
  checkDbSections(blob, header, ENTRY_LEN, LABEL)
  return new SelectorsDb(blob, header)
}

/** Load + parse the function-name catalog. Resolves to the same object on
 *  every call; throws on a load or format problem (see `createDbLoader`). */
export const loadSelectorsDb = createDbLoader(SELECTORS_DB_URL, parseSelectorsDb)

export type { SelectorsDb }
