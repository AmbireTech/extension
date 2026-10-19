// The names catalog's bundles against reference bundles made from the same
// `names_db.bin` by the firmware repo's catalog tool
// (`tools/companion-stub/db_trailers.py`), which the firmware's tests check
// against the device's verifier. Their proofs are checked in
// `db/catalogRoots.test.ts`.

import fs from 'fs'
import path from 'path'

import { bytesToHex, hexToBytes } from '../transport/bytes'
import { parseNamesDb } from './db'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({
  captureException: jest.fn()
}))

const DB_PATH = path.resolve(__dirname, '../../../../../public/pq1/names_db.bin')

// `db_trailers.py names --chain 1 --contract <addr>`.
// WETH on mainnet is an EXACT (chain 1) entry → bundle chain_id = 1.
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const WETH_C1_REFERENCE_HEX =
  '0100000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20d57726170706564204574686572' +
  '7b00000009000000fd5e8eff6a23ce184b283643e1640bf8d590a012a061702ce71c85a6617e6eaa503a' +
  '46af7f6367d6585c78dbe93f395d976050977429ff5dadc8441c20863cc6095701e9334fbe5fb10e9535' +
  '3e96aeed68c18b4fad538a5a52b1778552a36df0bcf88565f49300103d0a3c8ef490526817ab71109f28' +
  '2a9fc4343c14b006f50219f5218e882e40781af8584585ecd1718ee9f6da0e8b4e18ca195afdb7abeb4c' +
  'ce2d558216bf55494a91be3eae47a045b7e7daa3940349af13aedfafb768f7701a30c33bd8791ea9993d' +
  '12dcab0fb406e823fe21faedfce01251e564aee2cbe45c179ecc1924089f86246f85a6e574d97e5fb907' +
  'eb17a25141a66caaa12600df1da836a5148124c1b595ba2881aa2b604e0d1bae05e2f2d9d578dc70ee63eb8c'

// Uniswap V3 Router is a WILDCARD (chain 0) entry → a chain-1 query falls
// back to the wildcard and the bundle serializes chain_id = 0.
const UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
const UNISWAP_V3_ROUTER_C1_REFERENCE_HEX =
  '0000000000000000e592427a0aece92de3edee1f18e0157c0586156411556e697377617020563320526f' +
  '75746572b1000000090000004f67cf24a825974476634f25e095ffc5d4d9c9babfb15213acb67f623a00' +
  'f9c7381278b5e782723a39e38a21cac72b4fe8f8aaba2af12f627d3c9255020d37616020c052cee02e4b' +
  'a04a226197145fdf1fb4e718f5edc93c2bba0f7eca4d462983d07769136bd05b8953ea2bdb80424ccd34' +
  'be54cb42b2f38263e1c91b98946eb02b71fcb72af3240be052ce41fbf3cabd978560ac302049da33fa00' +
  '0b2de617bb8b7ce5992b163c79e870203388891e933c00fcf0e7d4887b7fbc9ba29452fdd8845c4ad499' +
  'efb98a0de7d6eb4d7b940c9247f0b5a1daffae4fe3798faed5a971381e26e535ac59b521261021ae2ac2' +
  '95633753d967cee4d7329bbf8453652c1da836a5148124c1b595ba2881aa2b604e0d1bae05e2f2d9d578' +
  'dc70ee63eb8c'

describe('names db', () => {
  let blob: Uint8Array

  beforeAll(() => {
    blob = new Uint8Array(fs.readFileSync(DB_PATH))
  })

  it('names OpenSea Seaport 1.6', () => {
    const db = parseNamesDb(blob)
    const bundle = db.buildBundle(1, hexToBytes('0x0000000000000068F116a894984e2DB1123eB395'))!
    expect(String.fromCharCode(...bundle.subarray(29, 29 + bundle[28]!))).toBe(
      'OpenSea Seaport 1.6'
    )
  })

  it('parses the header (331 names, proof depth 9)', () => {
    const db = parseNamesDb(blob)
    expect(db.header.entryCnt).toBe(331)
    expect(db.header.proofDepth).toBe(9)
  })

  it('builds an EXACT (chain 1) bundle byte-for-byte like the reference', () => {
    const db = parseNamesDb(blob)
    const bundle = db.buildBundle(1, hexToBytes(WETH))
    expect(bundle).not.toBeNull()
    expect(bytesToHex(bundle!)).toBe(WETH_C1_REFERENCE_HEX)
    // chain_id 1 LE, name "Wrapped Ether".
    expect(bundle!.subarray(0, 8)).toEqual(hexToBytes('0100000000000000'))
    expect(bundle![28]).toBe(13) // name_len
    expect(new TextDecoder().decode(bundle!.subarray(29, 42))).toBe('Wrapped Ether')
  })

  it('falls back to the wildcard (chain 0) entry for a chain-1 query', () => {
    const db = parseNamesDb(blob)
    const bundle = db.buildBundle(1, hexToBytes(UNISWAP_V3_ROUTER))
    expect(bundle).not.toBeNull()
    expect(bytesToHex(bundle!)).toBe(UNISWAP_V3_ROUTER_C1_REFERENCE_HEX)
    // Wildcard hit serializes chain_id = 0, name "Uniswap V3 Router".
    expect(bundle!.subarray(0, 8)).toEqual(hexToBytes('0000000000000000'))
    expect(new TextDecoder().decode(bundle!.subarray(29, 29 + bundle![28]!))).toBe(
      'Uniswap V3 Router'
    )
  })

  it('returns null for an address absent from the DB (renders 40-hex)', () => {
    const db = parseNamesDb(blob)
    expect(db.buildBundle(1, hexToBytes('0x000000000000000000000000000000000000dEaD'))).toBeNull()
  })
})
