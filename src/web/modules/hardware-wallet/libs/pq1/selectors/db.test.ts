// The selectors DB loader and bundle builder against the shipped
// `selectors_db.bin`. The bundles' proofs are checked against the firmware's
// root in `db/catalogRoots.test.ts`.

import fs from 'fs'
import path from 'path'

import { bytesToHex, hexToBytes } from '../transport/bytes'
import { SELECTOR_BUNDLE_MAX_LEN } from '../config'
import { parseSelectorsDb } from './db'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({
  captureException: jest.fn()
}))

const BLOB_PATH = path.resolve(__dirname, '../../../../../public/pq1/selectors_db.bin')
const db = parseSelectorsDb(new Uint8Array(fs.readFileSync(BLOB_PATH)))

describe('selectors db', () => {
  it('builds a bundle that names safeTransferFrom', () => {
    const bundle = db.buildBundle(hexToBytes(`0x42842e0e${'00'.repeat(96)}`))!
    expect(bundle.length).toBeLessThanOrEqual(SELECTOR_BUNDLE_MAX_LEN)
    // selector(4) text_len(1) text
    expect(bytesToHex(bundle.subarray(0, 4))).toBe('42842e0e')
    expect(String.fromCharCode(...bundle.subarray(5, 5 + bundle[4]!))).toBe(
      'safeTransferFrom(address,address,uint256)'
    )
  })

  it('returns null on a miss or calldata shorter than a selector', () => {
    expect(db.buildBundle(hexToBytes('0xffffffff'))).toBeNull()
    expect(db.buildBundle(hexToBytes('0x4284'))).toBeNull()
  })
})
