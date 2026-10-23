// The catalog parser and bundle assembler against the shipped
// `erc7730_db.bin`. The bundle is what goes inside the `[u16 BE len]`
// envelope of a trailer.

import fs from 'fs'
import path from 'path'
import { keccak256, toBytes } from 'viem'

import { hexToBytes } from '../transport/bytes'
import { CTX_CONTRACT, parseCatalog } from './catalog'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({
  captureException: jest.fn()
}))

const CATALOG_PATH = path.resolve(__dirname, '../../../../../public/pq1/erc7730_db.bin')

describe('erc7730 catalog', () => {
  let blob: Uint8Array

  beforeAll(() => {
    blob = new Uint8Array(fs.readFileSync(CATALOG_PATH))
  })

  it('parses the catalog header', () => {
    const cat = parseCatalog(blob)
    expect(cat.header.entryCnt).toBeGreaterThan(0)
    expect(cat.header.proofDepth).toBeGreaterThan(0)
    expect(cat.header.proofDepth).toBeLessThanOrEqual(32)
    expect(cat.entries.length).toBe(cat.header.entryCnt)
  })

  it('finds the USDT mainnet entry', () => {
    const cat = parseCatalog(blob)
    const usdt = hexToBytes('0xdAC17F958D2ee523a2206206994597C13D831ec7')
    const entry = cat.find(1n, usdt, CTX_CONTRACT)
    expect(entry).not.toBeNull()
    expect(entry!.chainId).toBe(1n)
    expect(entry!.contextKind).toBe(CTX_CONTRACT)
  })

  it('assembles the USDT mainnet bundle from its IR and proof', () => {
    const cat = parseCatalog(blob)
    const usdt = hexToBytes('0xdAC17F958D2ee523a2206206994597C13D831ec7')
    const entry = cat.find(1n, usdt, CTX_CONTRACT)!
    const ours = cat.assembleTrailer(entry)

    // The bundle's bytes, spelled out field by field so a layout regression
    // is easy to spot.
    const irOff = cat.header.poolOff + entry.irOff
    const ir = blob.subarray(irOff, irOff + entry.irLen)
    const proofBase = cat.header.proofsOff + entry.leafIndex * cat.header.proofDepth * 32
    const proof = blob.subarray(proofBase, proofBase + cat.header.proofDepth * 32)

    expect(ours.length).toBe(2 + ir.length + 4 + 4 + proof.length)
    // ir_len BE u16
    expect((ours[0]! << 8) | ours[1]!).toBe(ir.length)
    // ir bytes
    expect(Array.from(ours.subarray(2, 2 + ir.length))).toEqual(Array.from(ir))
    // leaf_index BE u32
    const lo = 2 + ir.length
    expect((ours[lo]! << 24) | (ours[lo + 1]! << 16) | (ours[lo + 2]! << 8) | ours[lo + 3]!).toBe(
      entry.leafIndex
    )
    // proof_depth BE u32
    const po = lo + 4
    expect((ours[po]! << 24) | (ours[po + 1]! << 16) | (ours[po + 2]! << 8) | ours[po + 3]!).toBe(
      cat.header.proofDepth
    )
    // proof bytes
    expect(Array.from(ours.subarray(po + 4))).toEqual(Array.from(proof))
  })

  it('returns null on miss', () => {
    const cat = parseCatalog(blob)
    const unknownContract = hexToBytes('0x' + '12'.repeat(20))
    expect(cat.find(1n, unknownContract, CTX_CONTRACT)).toBeNull()
    // Wrong chain for a real contract also misses.
    const usdt = hexToBytes('0xdAC17F958D2ee523a2206206994597C13D831ec7')
    expect(cat.find(999n, usdt, CTX_CONTRACT)).toBeNull()
  })

  it('finds an EIP-712 descriptor by the full type hash of any of its formats', () => {
    const cat = parseCatalog(blob)
    // Permit2's descriptor has formats for PermitBatch, PermitSingle and
    // PermitTransferFrom; its catalog row records only the first one's hash.
    const permit2 = hexToBytes('0x000000000022d473030f116ddee9f6b43ac78ba3')
    const details = 'PermitDetails(address token,uint160 amount,uint48 expiration,uint48 nonce)'
    const typeHash = (typeString: string) => hexToBytes(keccak256(toBytes(typeString)))
    const permitBatch = typeHash(
      `PermitBatch(PermitDetails[] details,address spender,uint256 sigDeadline)${details}`
    )
    const permitSingle = typeHash(
      `PermitSingle(PermitDetails details,address spender,uint256 sigDeadline)${details}`
    )

    const entry = cat.findEip712(1n, permit2, permitBatch)
    expect(entry).not.toBeNull()
    expect(cat.findEip712(1n, permit2, permitSingle)).toBe(entry)

    // The device matches all 32 bytes, so a hash sharing only the first ones
    // doesn't match; neither does another chain or the contract context.
    const samePrefix = permitSingle.slice()
    samePrefix[31] = samePrefix[31]! ^ 1
    expect(cat.findEip712(1n, permit2, samePrefix)).toBeNull()
    expect(cat.findEip712(999n, permit2, permitSingle)).toBeNull()
    expect(cat.find(1n, permit2, CTX_CONTRACT)).toBeNull()
  })
})
