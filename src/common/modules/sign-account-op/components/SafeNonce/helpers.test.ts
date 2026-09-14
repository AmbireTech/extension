import { isValidSafeNonce } from './helpers'

describe('isValidSafeNonce', () => {
  test('accepts a nonce equal to or greater than the latest chain nonce', () => {
    expect(isValidSafeNonce('10', 10n)).toBe(true)
    expect(isValidSafeNonce('11', 10n)).toBe(true)
  })

  test('rejects a nonce lower than the latest chain nonce', () => {
    expect(isValidSafeNonce('9', 10n)).toBe(false)
  })

  test('validates the uint256 range when the latest chain nonce is unavailable', () => {
    expect(isValidSafeNonce('0')).toBe(true)
    expect(isValidSafeNonce('-1')).toBe(false)
    expect(isValidSafeNonce((1n << 256n).toString())).toBe(false)
  })

  test('rejects empty, decimal, and non-numeric values', () => {
    expect(isValidSafeNonce('')).toBe(false)
    expect(isValidSafeNonce('1.5')).toBe(false)
    expect(isValidSafeNonce('nonce')).toBe(false)
  })
})
