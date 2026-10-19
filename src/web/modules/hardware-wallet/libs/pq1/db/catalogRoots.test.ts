// Every clear-signing catalog in `public/pq1` must prove to the Merkle root
// the PQ1 firmware pins for it (`secure/src/db_roots.rs` in the firmware
// repo, production build). The device rejects any bundle that doesn't, so a
// catalog that drifts from the firmware fails here instead of on the device.
//
// All four catalogs share one tree shape: leaf `sha256(0x00 || entry)`,
// node `sha256(0x01 || left || right)`, and bit i of the leaf index picks
// the side at level i.

import fs from 'fs'
import path from 'path'
import { sha256 } from 'viem'

import { parseErc20Db } from '../erc20/db'
import { parseCatalog } from '../erc7730/catalog'
import erc7730Review from '../erc7730/catalog.review.json'
import { parseNamesDb } from '../names/db'
import { parseSelectorsDb } from '../selectors/db'
import { bytesToHex, concatBytes, hexToBytes } from '../transport/bytes'
import { DB_HEADER_LEN, readU32Le, readU64Le } from './common'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({
  captureException: jest.fn()
}))

/** The roots the firmware pins (`ERC20_DB_ROOT`, `NAMES_DB_ROOT`,
 *  `SELECTOR_DB_ROOT`, `ERC7730_DESCRIPTORS_ROOT`). */
const FIRMWARE_ROOTS = {
  erc20: 'c435c576df0aa21956c5add530563780d2d878d115b4523ea84d9834e55bf203',
  names: '5320d4c40deb7aeeffd3ae9b995cc1fc1818df0341341f682f208eff5f1d6abc',
  selectors: '751caf5205a4ff5901ab6478af91ff36338f874b868378c610b693947456e46a',
  erc7730: '8c3dc4b2b1789106a1043aed08114b7827d56052dd920eb0dd6671a84db643e6'
}

const readCatalog = (fileName: string) =>
  new Uint8Array(fs.readFileSync(path.resolve(__dirname, '../../../../../public/pq1', fileName)))

/** The root an entry's Merkle proof leads to. */
function merkleRoot(entry: Uint8Array, leafIndex: number, proof: Uint8Array): string {
  let node = sha256(concatBytes([new Uint8Array([0]), entry]), 'bytes')
  let index = leafIndex
  for (let at = 0; at < proof.length; at += 32) {
    const sibling = proof.subarray(at, at + 32)
    const pair = index & 1 ? [sibling, node] : [node, sibling]
    node = sha256(concatBytes([new Uint8Array([1]), ...pair]), 'bytes')
    index >>>= 1
  }
  // The device refuses index bits above the tree's depth.
  expect(index).toBe(0)
  return bytesToHex(node)
}

/** Root of an ERC-20 / names / selectors bundle:
 *  `entry || leaf_index u32 LE || proof_depth u32 LE || proof`. */
function rootOfBundle(bundle: Uint8Array, entryLen: number): string {
  const leafIndex = readU32Le(bundle, entryLen)
  const proofDepth = readU32Le(bundle, entryLen + 4)
  const proof = bundle.subarray(entryLen + 8)
  expect(proof.length).toBe(proofDepth * 32)
  return merkleRoot(bundle.subarray(0, entryLen), leafIndex, proof)
}

/** Root of an ERC-7730 bundle, whose entry is the descriptor's IR:
 *  `ir_len u16 BE || ir || leaf_index u32 BE || proof_depth u32 BE || proof`. */
function rootOfErc7730Bundle(bundle: Uint8Array): string {
  const view = new DataView(bundle.buffer, bundle.byteOffset, bundle.byteLength)
  const irLen = view.getUint16(0)
  const leafIndex = view.getUint32(2 + irLen)
  const proofDepth = view.getUint32(2 + irLen + 4)
  const proof = bundle.subarray(2 + irLen + 8)
  expect(proof.length).toBe(proofDepth * 32)
  return merkleRoot(bundle.subarray(2, 2 + irLen), leafIndex, proof)
}

describe('clear-signing catalogs prove to the roots the firmware pins', () => {
  it('erc20_db.bin', () => {
    const blob = readCatalog('erc20_db.bin')
    const db = parseErc20Db(blob)
    const ENTRY_LEN = 40
    for (const row of [0, Math.floor(db.header.entryCnt / 2), db.header.entryCnt - 1]) {
      const base = DB_HEADER_LEN + row * ENTRY_LEN
      const bundle = db.buildBundle(readU64Le(blob, base), blob.slice(base + 8, base + 28))!
      // chain(8) contract(20) decimals(1) name_len(1) name symbol_len(1) symbol
      const nameLen = bundle[29]!
      const symbolLen = bundle[30 + nameLen]!
      expect(rootOfBundle(bundle, 31 + nameLen + symbolLen)).toBe(FIRMWARE_ROOTS.erc20)
    }
  })

  it('names_db.bin', () => {
    const db = parseNamesDb(readCatalog('names_db.bin'))
    const knownNames = [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH, a chain-1 entry
      '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router, a wildcard entry
      '0x0000000000000068F116a894984e2DB1123eB395' // OpenSea Seaport 1.6
    ]
    for (const address of knownNames) {
      const bundle = db.buildBundle(1, hexToBytes(address))!
      // chain(8) address(20) name_len(1) name
      expect(rootOfBundle(bundle, 29 + bundle[28]!)).toBe(FIRMWARE_ROOTS.names)
    }
  })

  it('selectors_db.bin', () => {
    const blob = readCatalog('selectors_db.bin')
    const db = parseSelectorsDb(blob)
    const ENTRY_LEN = 8
    for (const row of [0, Math.floor(db.header.entryCnt / 2), db.header.entryCnt - 1]) {
      const base = DB_HEADER_LEN + row * ENTRY_LEN
      const bundle = db.buildBundle(blob.slice(base, base + 4))!
      // selector(4) text_len(1) text
      expect(rootOfBundle(bundle, 5 + bundle[4]!)).toBe(FIRMWARE_ROOTS.selectors)
    }
  })

  it('erc7730_db.bin', () => {
    const catalog = parseCatalog(readCatalog('erc7730_db.bin'))
    const { entries } = catalog
    for (const entry of [
      entries[0]!,
      entries[entries.length >> 1]!,
      entries[entries.length - 1]!
    ]) {
      expect(rootOfErc7730Bundle(catalog.assembleTrailer(entry))).toBe(FIRMWARE_ROOTS.erc7730)
    }
    // The catalog builder's record of the same blob (see `erc7730/ir.test.ts`).
    expect(erc7730Review.root).toBe(`0x${FIRMWARE_ROOTS.erc7730}`)
  })
})
