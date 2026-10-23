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
  '0100000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20d5772617070656420457468657286' +
  '00000009000000403cf32c6d2f39aadfbd7747a9c9929fbe65d1bcf5d3765c2caad529ce7f77abed0a8cb5' +
  '840a9ddb7c5b6dc48034f8382ac7d56a16b21b63442d4155c94347d41dd7499e5ff112e704bea555530561' +
  'df5495d4306005edacf61d9d3628654c35e550c85be0a9cb1e74257971143d02430d0ecfecd11fb82118b8' +
  '9be4b7c9acfa5e2565692a4c390f60d8b303d799fadde32010b8d037ebd946f3de0b87f27dd4271254b54c' +
  '8d2b6208107a06e4a96cfad87058a9a28954414b9fc174366a1dff164b6bb7ab9395e94d8b58cc7d3642b2' +
  '509c220b7e9b323f27e552e164fbb3b573c83f5ae18c6c33c842adb525ea745d62679c6e20ce186015eb0a' +
  '306bbe8c54e32f118ba39c4167bad17e22b1fd40088f89f8c8c26fbc251d76977ae4386588'

// Uniswap V3 Router is a WILDCARD (chain 0) entry → a chain-1 query falls
// back to the wildcard and the bundle serializes chain_id = 0.
const UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
const UNISWAP_V3_ROUTER_C1_REFERENCE_HEX =
  '0000000000000000e592427a0aece92de3edee1f18e0157c0586156411556e697377617020563320526f75' +
  '746572c000000009000000b9e780344bda88842d5d518566565feb8fcbbc7ec0117e7ac669148622428000' +
  'a3515b17e9f15a7f2ea79c8c0adf3e6ee437ca2c943a54c2c4311c66db9c8bb69518ce3c4739db363bef3a' +
  '5ae8341115bbe345b69389b3807a5751d1c33da1ee09bc01ecc36fa8629deb061e4e8d081eb74171d44861' +
  '18a2fb4e1f3c19db672702333aa0d063f75c8c259dc81677dab0d30e0ef4982422716e33a04ca339a01283' +
  '15008f119ebf982d83e343e4a5eb475addb49eb996a215c3e100a178b7a380c219c23349247f453d121aae' +
  'b76be5d68bb903b56d70cd27ae89dd95fd10019673c83f5ae18c6c33c842adb525ea745d62679c6e20ce18' +
  '6015eb0a306bbe8c54e32f118ba39c4167bad17e22b1fd40088f89f8c8c26fbc251d76977ae4386588'

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

  it('parses the header (355 names, proof depth 9)', () => {
    const db = parseNamesDb(blob)
    expect(db.header.entryCnt).toBe(355)
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
