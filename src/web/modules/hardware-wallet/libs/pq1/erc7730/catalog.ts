// The ERC-7730 descriptor catalog (`public/pq1/erc7730_db.bin`):
// clear-signing descriptors, compiled into the device's IR format, for
// contracts (calls) and EIP-712 typed data. With one attached, the device
// shows a call's or a message's fields the way the descriptor names them.
// The device checks every bundle against the catalog's Merkle root (see
// `db/common.ts`) and that it describes the request's chain, contract and
// function or primary type.
//
// Entry table: 72 bytes per row — chain_id (u64 LE), contract (20),
// primary_type_hash (32, zero for contracts), context kind (1), 3 unused
// bytes, ir_offset (u32 LE), ir_length (u32 LE).
//
// Bundle layout:
//
//   ir_len(u16 BE) || ir || leaf_index(u32 BE) || proof_depth(u32 BE) || proof

import { ERC7730_BUNDLE_MAX_LEN } from '../config'
import {
  checkDbSections,
  createDbLoader,
  DB_HEADER_LEN,
  parseDbHeader,
  readProof,
  readU32Le,
  readU64Le,
  reportClearSigningFallback,
  type DbHeader
} from '../db/common'
import { concatBytes, isSameBytes, u16be, u32be } from '../transport/bytes'
import { CTX_CONTRACT, CTX_EIP712, parseErc7730Ir, type Erc7730IrView } from './ir'

export { CTX_CONTRACT, CTX_EIP712 }

const CATALOG_URL = 'pq1/erc7730_db.bin'

const HEADER_MAGIC = new Uint8Array([0x50, 0x37, 0x33, 0x30]) // "P730"
const LABEL = 'erc7730 catalog'
const ENTRY_LEN = 72

/** One row of the entry table. */
export interface CatalogEntry {
  /** Position in the Merkle tree (also the row index into the proofs pool). */
  leafIndex: number
  chainId: bigint
  contract: Uint8Array // 20 bytes
  primaryTypeHash: Uint8Array // 32 bytes (zero for CTX_CONTRACT)
  contextKind: number // CTX_CONTRACT (1) or CTX_EIP712 (2)
  irOff: number
  irLen: number
}

class Catalog {
  constructor(
    private readonly blob: Uint8Array,
    readonly header: DbHeader,
    readonly entries: CatalogEntry[]
  ) {}

  /** The first entry for `(chainId, contract, contextKind)`, or null; for
   *  typed data, `findEip712` finds the entry for a primary type. Without a
   *  match, the request goes without a descriptor and the device applies
   *  its own rule for the call: blind signing, or a refusal for a call it
   *  knows must be clear-signed. A linear scan: the catalog has a few
   *  hundred entries. */
  find(chainId: bigint | number, contract: Uint8Array, contextKind: number): CatalogEntry | null {
    if (contract.length !== 20) return null
    const cid = BigInt(chainId)
    return (
      this.entries.find(
        (e) =>
          e.contextKind === contextKind && e.chainId === cid && isSameBytes(e.contract, contract)
      ) ?? null
    )
  }

  /** The EIP-712 entry for `contract` on `chainId` with a format for the
   *  primary type `primaryTypeHash`, or null. Like the device, it matches
   *  all 32 bytes of the hash against every format of a descriptor: the
   *  entry table only records the first format's hash. */
  findEip712(
    chainId: bigint | number,
    contract: Uint8Array,
    primaryTypeHash: Uint8Array
  ): CatalogEntry | null {
    if (contract.length !== 20 || primaryTypeHash.length !== 32) return null
    const cid = BigInt(chainId)
    const hasFormat = (e: CatalogEntry) =>
      !!this.parseIr(e)?.formats.some(
        (format) => format.typeHash !== null && isSameBytes(format.typeHash, primaryTypeHash)
      )
    return (
      this.entries.find(
        (e) =>
          e.contextKind === CTX_EIP712 &&
          e.chainId === cid &&
          isSameBytes(e.contract, contract) &&
          hasFormat(e)
      ) ?? null
    )
  }

  /** The compiled IR of `entry`, parsed for routing decisions, or null if
   *  this reader can't walk it (the device decides about such a leaf). */
  parseIr(entry: CatalogEntry): Erc7730IrView | null {
    const irStart = this.header.poolOff + entry.irOff
    if (irStart + entry.irLen > this.blob.length) return null
    try {
      return parseErc7730Ir(this.blob.subarray(irStart, irStart + entry.irLen))
    } catch (e) {
      reportClearSigningFallback(`erc7730 catalog: leaf ${entry.leafIndex} IR is unreadable`, e)
      return null
    }
  }

  /** The bundle for `entry` (see the layout above). */
  assembleTrailer(entry: CatalogEntry): Uint8Array {
    const irStart = this.header.poolOff + entry.irOff
    const irEnd = irStart + entry.irLen
    if (irEnd > this.blob.length) {
      throw new Error(`erc7730 catalog: IR slice out of range for leaf ${entry.leafIndex}`)
    }
    const ir = this.blob.subarray(irStart, irEnd)
    const proof = readProof(this.blob, this.header, entry.leafIndex, LABEL)
    const bundle = concatBytes([
      u16be(ir.length),
      ir,
      u32be(entry.leafIndex),
      u32be(this.header.proofDepth),
      proof
    ])
    if (bundle.length > ERC7730_BUNDLE_MAX_LEN) {
      throw new Error(
        `erc7730 catalog: assembled bundle ${bundle.length} B exceeds firmware cap ${ERC7730_BUNDLE_MAX_LEN} B`
      )
    }
    return bundle
  }
}

/** Parse the catalog blob (header, entry table, sections). */
export function parseCatalog(blob: Uint8Array): Catalog {
  const header = parseDbHeader(blob, HEADER_MAGIC, 'P730', LABEL)
  checkDbSections(blob, header, ENTRY_LEN, LABEL)

  const entries: CatalogEntry[] = []
  for (let i = 0; i < header.entryCnt; i++) {
    const base = DB_HEADER_LEN + i * ENTRY_LEN
    entries.push({
      leafIndex: i,
      chainId: readU64Le(blob, base),
      contract: blob.slice(base + 8, base + 28),
      primaryTypeHash: blob.slice(base + 28, base + 60),
      contextKind: blob[base + 60]!,
      irOff: readU32Le(blob, base + 64),
      irLen: readU32Le(blob, base + 68)
    })
  }

  return new Catalog(blob, header, entries)
}

/** Load + parse the ERC-7730 catalog. Resolves to the same object on every
 *  call; throws on a load or format problem (see `createDbLoader`). */
export const loadErc7730Catalog = createDbLoader(CATALOG_URL, parseCatalog)

export type { Catalog }
