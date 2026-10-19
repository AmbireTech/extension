// The ERC-20 catalog's bundles against reference bundles made from the same
// `erc20_db.bin` by the firmware repo's catalog tool
// (`tools/companion-stub/db_trailers.py`), which the firmware's tests check
// against the device's verifier. The bundle is what goes inside a trailer's
// `[u16 BE len]` envelope; its proof is checked in `db/catalogRoots.test.ts`.

import fs from 'fs'
import path from 'path'

import { bytesToHex, hexToBytes } from '../transport/bytes'
import { parseErc20Db } from './db'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({
  captureException: jest.fn()
}))

const DB_PATH = path.resolve(__dirname, '../../../../../public/pq1/erc20_db.bin')

// `db_trailers.py erc20 --chain 8453 --contract
// 0x09bE1692ca16e06f536F0038fF11D1dA8524aDB1` (Telcoin on Base).
const TELCOIN_BASE = '0x09bE1692ca16e06f536F0038fF11D1dA8524aDB1'
const TELCOIN_BASE_REFERENCE_HEX =
  '052100000000000009be1692ca16e06f536f0038ff11d1da8524adb1020754656c636f' +
  '696e0354454c2a3400000f000000c032058354f4e0d2347e24012630639d7ebee890ac' +
  'd3949db6efc58903dec9839af42256777203671e12a477cf239f41833e01955d45b169' +
  '67b5aaad30d679ebb063d50c25422142e17ad6b68599bdb2c3bed51d715b5872d84111' +
  '9b15b75d49002863913fec1f1d901fa04fb3dd8375185816e640021083cc571b9c40b7' +
  '84e8ad462514d52e6ec053ac0c46de04302761e012e144969bac34c202d1cdf9e3f259' +
  '96a0006d33c9cc6922e9495aaa31a993e92246482f38895aa2661816afb2816af27e9c' +
  '6d8d7127ac89244219f85440e0465ffbe74c66e92089568ffdaf0a94910d6698a699b4' +
  '1cb3a95b04790b611983b78be6955e5d88f8be0b95ccb1b0c5a8dfff8479f499c7f7dd' +
  'c13912ac2a68d330633df1be20c3de48ea21cc4cc90e727fb37852b209ce28e3ca14f0' +
  '135926959a8810df463519801ce58cd21c604f6a8436f7950b6ff158e320258c6d5d73' +
  'a33e6a1dbdc59a08a4096975ece2f6c6ebf50fec35ecfccefc73b1965510eeb47ee0c9' +
  '051a1b8ac8f75f39bbf11e80f519ef51f6946e9247eab2b1b9f580652ef94f25fd382b' +
  '9b479844b6599f8e966a79a9c51a3e564843968a3a93914ec1cc1d41892ac8e82b31f3' +
  'c9d61b45dc834967c1268f6045ea78f8364ed75b5ab9434bbdcef7ffd5eebe95e4f87a' +
  'b26bafac'

describe('erc20 db', () => {
  let blob: Uint8Array

  beforeAll(() => {
    blob = new Uint8Array(fs.readFileSync(DB_PATH))
  })

  it('parses the header and reports the production proof depth (15)', () => {
    const db = parseErc20Db(blob)
    // 17,946 tokens across 11 chains, Merkle depth 15.
    expect(db.header.entryCnt).toBeGreaterThan(15_000)
    expect(db.header.proofDepth).toBe(15)
  })

  it('builds the Telcoin/Base bundle byte-for-byte like the reference', () => {
    const db = parseErc20Db(blob)
    const bundle = db.buildBundle(8453, hexToBytes(TELCOIN_BASE))
    expect(bundle).not.toBeNull()
    expect(bytesToHex(bundle!)).toBe(TELCOIN_BASE_REFERENCE_HEX)

    // Spell out the fields a wire-format regression would break.
    expect(bundle!.subarray(0, 8)).toEqual(hexToBytes('0521000000000000')) // chain_id 8453 LE
    expect(bundle![28]).toBe(2) // decimals
    expect(bundle![29]).toBe(7) // name_len
    expect(new TextDecoder().decode(bundle!.subarray(30, 37))).toBe('Telcoin')
    expect(bundle![37]).toBe(3) // symbol_len
    expect(new TextDecoder().decode(bundle!.subarray(38, 41))).toBe('TEL')
    // leaf_index u32 LE = 0x0000342a, proof_depth u32 LE = 15, proof = 15*32.
    expect(bundle!.subarray(41, 45)).toEqual(hexToBytes('2a340000'))
    expect(bundle!.subarray(45, 49)).toEqual(hexToBytes('0f000000'))
    expect(bundle!.length).toBe(49 + 15 * 32)
  })

  it('returns null for a token absent from the DB (safe degrade)', () => {
    const db = parseErc20Db(blob)
    const absent = hexToBytes('0x000000000000000000000000000000000000dead')
    expect(db.buildBundle(8453, absent)).toBeNull()
  })

  it('keys by (chain_id, contract): a Base token is not found on a different chain', () => {
    const db = parseErc20Db(blob)
    // Telcoin's Base leaf must not resolve under another chain id: the same
    // address can be a different token there. Use a chain id with no such
    // entry.
    expect(db.buildBundle(999999, hexToBytes(TELCOIN_BASE))).toBeNull()
  })
})
