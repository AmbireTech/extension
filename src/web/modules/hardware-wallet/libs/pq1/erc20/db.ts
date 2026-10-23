// The ERC-20 metadata catalog (`public/pq1/erc20_db.bin`): token name,
// symbol and decimals per (chain, contract), so the device can show
// "Send 1 USDC" instead of a raw token address and amount. The device
// checks every bundle against the catalog's Merkle root (see `db/common.ts`).
//
// Bundle layout (little-endian, except the address and proof bytes):
//
//   chain_id     u64 LE
//   contract     [u8; 20]
//   decimals     u8
//   name_len     u8                (1..=64)
//   name         [u8; name_len]    ASCII
//   symbol_len   u8                (1..=64)
//   symbol       [u8; symbol_len]  ASCII
//   leaf_index   u32 LE
//   proof_depth  u32 LE            (<= 32)
//   proof        [u8; proof_depth * 32]
//
// It is attached to a call as a trailer, and to a CoW order bundle as the
// sell and buy legs.

import { ERC20_BUNDLE_MAX_LEN } from '../config'
import {
  checkDbSections,
  createDbLoader,
  DB_HEADER_LEN,
  findSortedEntry,
  parseDbHeader,
  readPoolString,
  readProof,
  readU32Le,
  readU64Le,
  writeU32Le,
  writeU64Le,
  type DbHeader
} from '../db/common'

const ERC20_DB_URL = 'pq1/erc20_db.bin'

const HEADER_MAGIC = new Uint8Array([0x45, 0x52, 0x43, 0x32]) // "ERC2"
const LABEL = 'erc20 db'

// Entry table: 40 bytes per row, sorted by (chain_id, contract).
const ENTRY_LEN = 40
const ENTRY_OFF_CHAIN_ID = 0 // u64 LE
const ENTRY_OFF_CONTRACT = 8 // [u8; 20]
const ENTRY_OFF_NAME_OFF = 28 // u32 LE (offset into the string pool)
const ENTRY_OFF_SYMBOL_OFF = 32 // u32 LE
const ENTRY_OFF_DECIMALS = 36 // u8

class Erc20Db {
  constructor(
    private readonly blob: Uint8Array,
    readonly header: DbHeader
  ) {}

  /** Leftmost entry-table row for `(chainId, contract20)`, or -1: a binary
   *  search over the raw rows, which are sorted by (chain_id, contract), so
   *  the 9.6 MB blob needs no index of its own in memory. */
  private findRow(chainId: bigint, contract20: Uint8Array): number {
    return findSortedEntry(this.header.entryCnt, (row) => {
      const base = DB_HEADER_LEN + row * ENTRY_LEN
      const rowChain = readU64Le(this.blob, base + ENTRY_OFF_CHAIN_ID)
      if (rowChain < chainId) return -1
      if (rowChain > chainId) return 1
      for (let j = 0; j < 20; j++) {
        const a = this.blob[base + ENTRY_OFF_CONTRACT + j]!
        const b = contract20[j]!
        if (a !== b) return a < b ? -1 : 1
      }
      return 0
    })
  }

  /** The ERC-20 bundle for `(chainId, contract20)`, or null on a miss (the
   *  device then shows the token as unknown). Keyed by chain as well as
   *  address: the same address can be a different token on another chain. */
  buildBundle(chainId: number | bigint, contract20: Uint8Array): Uint8Array | null {
    if (contract20.length !== 20) throw new Error('contract must be 20 bytes')
    const leafIndex = this.findRow(BigInt(chainId), contract20)
    if (leafIndex < 0) return null

    const base = DB_HEADER_LEN + leafIndex * ENTRY_LEN
    const decimals = this.blob[base + ENTRY_OFF_DECIMALS]!
    const name = readPoolString(
      this.blob,
      this.header.poolOff + readU32Le(this.blob, base + ENTRY_OFF_NAME_OFF),
      LABEL
    )
    const symbol = readPoolString(
      this.blob,
      this.header.poolOff + readU32Le(this.blob, base + ENTRY_OFF_SYMBOL_OFF),
      LABEL
    )
    const proof = readProof(this.blob, this.header, leafIndex, LABEL)

    const bundleLen = 8 + 20 + 1 + (1 + name.length) + (1 + symbol.length) + 4 + 4 + proof.length
    if (bundleLen > ERC20_BUNDLE_MAX_LEN) {
      throw new Error(
        `erc20 db: assembled bundle ${bundleLen} B exceeds firmware cap ${ERC20_BUNDLE_MAX_LEN} B`
      )
    }

    const out = new Uint8Array(bundleLen)
    let p = 0
    writeU64Le(out, p, BigInt(chainId))
    p += 8
    out.set(contract20, p)
    p += 20
    out[p++] = decimals
    out[p++] = name.length
    out.set(name, p)
    p += name.length
    out[p++] = symbol.length
    out.set(symbol, p)
    p += symbol.length
    writeU32Le(out, p, leafIndex)
    p += 4
    writeU32Le(out, p, this.header.proofDepth)
    p += 4
    out.set(proof, p)
    return out
  }
}

export function parseErc20Db(blob: Uint8Array): Erc20Db {
  const header = parseDbHeader(blob, HEADER_MAGIC, 'ERC2', LABEL)
  checkDbSections(blob, header, ENTRY_LEN, LABEL)
  return new Erc20Db(blob, header)
}

/** Load + parse the ERC-20 catalog. Resolves to the same object on every
 *  call; throws on a load or format problem (see `createDbLoader`). */
export const loadErc20Db = createDbLoader(ERC20_DB_URL, parseErc20Db)

export type { Erc20Db }
