// The address-name catalog (`public/pq1/names_db.bin`): names of
// well-known contracts, so the device can show "Uniswap V3 Router" instead
// of a raw address. The device checks every bundle against the catalog's
// Merkle root (see `db/common.ts`).
//
// Bundle layout (little-endian, except the address and proof bytes):
//
//   chain_id     u64 LE        0 = wildcard / chain-agnostic
//   address      [u8; 20]
//   name_len     u8            (1..=32)
//   name         [u8; name_len]   printable ASCII (0x20..=0x7e)
//   leaf_index   u32 LE
//   proof_depth  u32 LE        (<= 32)
//   proof        [u8; proof_depth * 32]
//
// The catalog's entry table is keyed by a 16-byte SHA-256 short key, not
// the raw address, so a lookup hashes `(chain_id, address)` the way the
// catalog was built. The Merkle leaf still binds the full
// `(chain_id, address, name)`.

import { sha256 } from 'viem'

import { NAME_BUNDLE_MAX_LEN } from '../config'
import { concatBytes, u64be } from '../transport/bytes'
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
  writeU64Le,
  type DbHeader
} from '../db/common'

const NAMES_DB_URL = 'pq1/names_db.bin'

const HEADER_MAGIC = new Uint8Array([0x4e, 0x41, 0x4d, 0x53]) // "NAMS"
const LABEL = 'names db'

// Entry table: 20 bytes per row, sorted by short_key.
const ENTRY_LEN = 20
const ENTRY_OFF_SHORT_KEY = 0 // [u8; 16]
const ENTRY_OFF_NAME_OFF = 16 // u32 LE (offset into the string pool)
const SHORT_KEY_LEN = 16

/** Domain tag of the short key:
 *  `sha256(tag || chain_id[8 BE] || address[20])[..16]`. Note this is the
 *  index key only — the Merkle leaf hashes the canonical fields. */
const SHORT_KEY_TAG = new TextEncoder().encode('pqsigner-name-key-v1')

/** `chain_id = 0` marks a name that holds on every chain (real EVM chain
 *  ids start at 1). */
const WILDCARD_CHAIN_ID = 0n

/** `sha256("pqsigner-name-key-v1" || chain_id[8 BE] || address[20])[..16]`
 *  — the on-disk index key, raw bytes. */
function shortKey(chainId: bigint, address20: Uint8Array): Uint8Array {
  const pre = concatBytes([SHORT_KEY_TAG, u64be(chainId), address20])
  return sha256(pre, 'bytes').subarray(0, SHORT_KEY_LEN)
}

class NamesDb {
  constructor(
    private readonly blob: Uint8Array,
    readonly header: DbHeader
  ) {}

  /** Leftmost entry-table row whose 16-byte short_key equals `key`, or
   *  -1: a binary search over the raw rows, which are sorted by short_key. */
  private findRow(key: Uint8Array): number {
    return findSortedEntry(this.header.entryCnt, (row) => {
      const base = DB_HEADER_LEN + row * ENTRY_LEN + ENTRY_OFF_SHORT_KEY
      for (let j = 0; j < SHORT_KEY_LEN; j++) {
        const a = this.blob[base + j]!
        const b = key[j]!
        if (a !== b) return a < b ? -1 : 1
      }
      return 0
    })
  }

  /** The name bundle for `(chainId, address20)`: a name for that chain
   *  first, then one for every chain, the order the device looks them up.
   *  Null on a miss (the device then shows the raw address). The bundle's
   *  `chain_id` is the one found (0 for an every-chain name). */
  buildBundle(chainId: number | bigint, address20: Uint8Array): Uint8Array | null {
    if (address20.length !== 20) throw new Error('address must be 20 bytes')
    const queried = BigInt(chainId)

    let hitChain = queried
    let leafIndex = this.findRow(shortKey(queried, address20))
    if (leafIndex < 0 && queried !== WILDCARD_CHAIN_ID) {
      hitChain = WILDCARD_CHAIN_ID
      leafIndex = this.findRow(shortKey(WILDCARD_CHAIN_ID, address20))
    }
    if (leafIndex < 0) return null

    const base = DB_HEADER_LEN + leafIndex * ENTRY_LEN
    const name = readPoolString(
      this.blob,
      this.header.poolOff + readU32Le(this.blob, base + ENTRY_OFF_NAME_OFF),
      LABEL
    )
    const proof = readProof(this.blob, this.header, leafIndex, LABEL)

    const bundleLen = 8 + 20 + 1 + name.length + 4 + 4 + proof.length
    if (bundleLen > NAME_BUNDLE_MAX_LEN) {
      throw new Error(
        `names db: assembled bundle ${bundleLen} B exceeds firmware cap ${NAME_BUNDLE_MAX_LEN} B`
      )
    }

    const out = new Uint8Array(bundleLen)
    let p = 0
    writeU64Le(out, p, hitChain)
    p += 8
    out.set(address20, p)
    p += 20
    out[p++] = name.length
    out.set(name, p)
    p += name.length
    writeU32Le(out, p, leafIndex)
    p += 4
    writeU32Le(out, p, this.header.proofDepth)
    p += 4
    out.set(proof, p)
    return out
  }
}

export function parseNamesDb(blob: Uint8Array): NamesDb {
  const header = parseDbHeader(blob, HEADER_MAGIC, 'NAMS', LABEL)
  checkDbSections(blob, header, ENTRY_LEN, LABEL)
  return new NamesDb(blob, header)
}

/** Load + parse the names catalog. Resolves to the same object on every
 *  call; throws on a load or format problem (see `createDbLoader`). */
export const loadNamesDb = createDbLoader(NAMES_DB_URL, parseNamesDb)

export type { NamesDb }
