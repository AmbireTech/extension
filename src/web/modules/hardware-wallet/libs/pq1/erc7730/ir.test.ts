// The IR reader against every leaf of the shipped `erc7730_db.bin`, checked
// against what the firmware's catalog builder recorded for the same blob
// (`secure/data/erc7730.review.txt` in the firmware repo, extracted to
// `catalog.review.json`).

import fs from 'fs'
import path from 'path'

import { bytesToHex, hexToBytes } from '../transport/bytes'
import { CTX_CONTRACT, CTX_EIP712, parseCatalog } from './catalog'
import review from './catalog.review.json'
import { FORMAT_OP_TOKEN_AMOUNT, findIrFormat, tokenAmountAddresses } from './ir'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({
  captureException: jest.fn()
}))

const CATALOG_PATH = path.resolve(__dirname, '../../../../../public/pq1/erc7730_db.bin')
const catalog = parseCatalog(new Uint8Array(fs.readFileSync(CATALOG_PATH)))
const hex = (b: Uint8Array) => `0x${bytesToHex(b)}`

const wordOf = (addr: string) => `${'0'.repeat(24)}${addr.slice(2).toLowerCase()}`

describe('erc7730 IR reader', () => {
  it('walks every leaf with the selectors the catalog builder recorded', () => {
    expect(catalog.entries).toHaveLength(review.leaves.length)
    for (const leaf of review.leaves) {
      const entry = catalog.entries[leaf.leaf]!
      const view = catalog.parseIr(entry)
      expect(view).not.toBeNull()
      expect(hex(view!.contract)).toBe(leaf.contract)
      expect(view!.chainId).toBe(BigInt(leaf.chainId))
      expect(view!.contextKind).toBe(leaf.ctx === 'eip712' ? CTX_EIP712 : CTX_CONTRACT)
      expect(view!.formats.map((f) => hex(f.selector))).toEqual(leaf.selectors)
      const tokenAmounts = view!.formats
        .flatMap((f) => f.fields)
        .filter((f) => f.formatOp === FORMAT_OP_TOKEN_AMOUNT)
      expect(tokenAmounts).toHaveLength(leaf.tokenAmountFields)
    }
  })

  it('has no ethUnoswap format in the 1inch V6 descriptor (the device refuses that call)', () => {
    const router = hexToBytes('0x111111125421ca6dc452d289314280a0f8842a65')
    const view = catalog.parseIr(catalog.find(1n, router, CTX_CONTRACT)!)!
    expect(findIrFormat(view, hexToBytes('0xa76dfc3b'))).toBeUndefined()
  })

  it('resolves the constant stETH token of wstETH wrap', () => {
    const wsteth = hexToBytes('0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0')
    const data = hexToBytes(
      '0xea598cb00000000000000000000000000000000000000000000000000de0b6b3a763fffe'
    )
    const view = catalog.parseIr(catalog.find(1n, wsteth, CTX_CONTRACT)!)!
    const format = findIrFormat(view, data.subarray(0, 4))!
    expect(tokenAmountAddresses(format, { to: wsteth, data }).map(hex)).toEqual([
      '0xae7ab96520de3a18e5e111b5eaab095312d7fe84'
    ])
  })

  it('resolves the asset argument of Aave supply', () => {
    const pool = hexToBytes('0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2')
    const usdc = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    const data = hexToBytes(
      `0x617ba037${wordOf(usdc)}${'0'.repeat(56)}52c02155${wordOf(
        '0x81ec2081dfb42c5291c55e6123d527eb744a5ffb'
      )}${'0'.repeat(64)}`
    )
    const view = catalog.parseIr(catalog.find(1n, pool, CTX_CONTRACT)!)!
    const format = findIrFormat(view, data.subarray(0, 4))!
    expect(tokenAmountAddresses(format, { to: pool, data }).map(hex)).toContain(usdc)
  })

  it('resolves `@.to` to the called token (USDT approve)', () => {
    const usdt = hexToBytes('0xdac17f958d2ee523a2206206994597c13d831ec7')
    const data = hexToBytes(
      `0x095ea7b3${wordOf('0x7a250d5630b4cf539739df2c5dacb4c659f2488d')}${'f'.repeat(64)}`
    )
    const view = catalog.parseIr(catalog.find(1n, usdt, CTX_CONTRACT)!)!
    const format = findIrFormat(view, data.subarray(0, 4))!
    expect(tokenAmountAddresses(format, { to: usdt, data }).map(hex)).toEqual([hex(usdt)])
  })
})
