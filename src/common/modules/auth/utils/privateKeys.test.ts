import { toBeHex, Wallet } from 'ethers'

import { getAddressFromPrivateKey, getDuplicatePrivateKeyIndexes } from './privateKeys'

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

describe('getAddressFromPrivateKey', () => {
  const expectedAddress = new Wallet(privateKey1).address

  it('returns the address of the account the private key controls', () => {
    expect(getAddressFromPrivateKey(privateKey1)).toBe(expectedAddress)
  })
  it('accepts a private key without the 0x prefix or with surrounding spaces', () => {
    expect(getAddressFromPrivateKey(privateKey1.slice(2))).toBe(expectedAddress)
    expect(getAddressFromPrivateKey(`  ${privateKey1}  `)).toBe(expectedAddress)
  })
  it('returns null for a value that is not a valid private key', () => {
    expect(getAddressFromPrivateKey('')).toBeNull()
    expect(getAddressFromPrivateKey('not-a-private-key')).toBeNull()
    expect(getAddressFromPrivateKey(`${privateKey1.slice(0, -1)}z`)).toBeNull()
  })
})
