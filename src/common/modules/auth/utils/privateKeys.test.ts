import { toBeHex } from 'ethers'

import { getDuplicatePrivateKeyIndexes } from './privateKeys'

const privateKey1 = toBeHex(1, 32)
const privateKey2 = toBeHex(2, 32)
const privateKey3 = toBeHex(0xabc, 32)

const toFields = (values: string[]) => values.map((value) => ({ value }))

describe('getDuplicatePrivateKeyIndexes', () => {
  it('returns no indexes when every private key is different', () => {
    expect(
      getDuplicatePrivateKeyIndexes(toFields([privateKey1, privateKey2, privateKey3]))
    ).toEqual([])
  })
  it('returns the indexes of both fields when a private key is entered twice', () => {
    expect(
      getDuplicatePrivateKeyIndexes(toFields([privateKey1, privateKey2, privateKey1]))
    ).toEqual([0, 2])
  })
  it('returns every index when a private key is entered more than twice', () => {
    expect(
      getDuplicatePrivateKeyIndexes(toFields([privateKey1, privateKey1, privateKey1]))
    ).toEqual([0, 1, 2])
  })
  it('treats keys that differ only by the 0x prefix, letter case or spaces as the same', () => {
    expect(
      getDuplicatePrivateKeyIndexes(
        toFields([privateKey3, privateKey3.slice(2), ` 0x${privateKey3.slice(2).toUpperCase()} `])
      )
    ).toEqual([0, 1, 2])
  })
  it('never treats empty fields as duplicates', () => {
    expect(getDuplicatePrivateKeyIndexes(toFields(['', '  ', privateKey1]))).toEqual([])
  })
  it('returns no indexes for a single field', () => {
    expect(getDuplicatePrivateKeyIndexes(toFields([privateKey1]))).toEqual([])
  })
})
