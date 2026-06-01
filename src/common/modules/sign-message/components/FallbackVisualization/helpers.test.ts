import { EIP712_DATA_PREVIEW_MAX_LENGTH, getParsedMessageValue } from './helpers'

describe('getParsedMessageValue', () => {
  test('shortens long EIP-712 data values to the configured max length', () => {
    const value = `0x${'1'.repeat(100)}`
    const displayedValue = getParsedMessageValue('data', value)

    expect(displayedValue).toHaveLength(EIP712_DATA_PREVIEW_MAX_LENGTH)
    expect(displayedValue).toContain('...')
  })

  test('does not shorten values from other fields', () => {
    const value = `0x${'1'.repeat(100)}`

    expect(getParsedMessageValue('messageHash', value)).toBe(value)
  })
})
