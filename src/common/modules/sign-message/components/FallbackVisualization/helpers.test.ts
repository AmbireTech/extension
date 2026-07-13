import {
  EIP712_VALUE_PREVIEW_MAX_LENGTH,
  getEip712IntegerFieldNames,
  getParsedMessageValue,
  isParsedMessageValueShortened
} from './helpers'

describe('getParsedMessageValue', () => {
  test('shortens long EIP-712 hex string values to the configured max length', () => {
    const value = `0x${'1'.repeat(100)}`
    const displayedValue = getParsedMessageValue('data', value)

    expect(displayedValue).toHaveLength(EIP712_VALUE_PREVIEW_MAX_LENGTH)
    expect(displayedValue).toContain('...')
    expect(isParsedMessageValueShortened('data', value)).toBe(true)
  })

  test('shortens long EIP-712 hex string values from any field', () => {
    const value = `0x${'1'.repeat(100)}`

    expect(getParsedMessageValue('messageHash', value)).toHaveLength(
      EIP712_VALUE_PREVIEW_MAX_LENGTH
    )
    expect(isParsedMessageValueShortened('messageHash', value)).toBe(true)
  })

  test('does not shorten short values', () => {
    const value = 'short value'

    expect(getParsedMessageValue('messageHash', value)).toBe(value)
    expect(isParsedMessageValueShortened('messageHash', value)).toBe(false)
  })

  test('does not shorten long non-hex string values', () => {
    const value = 'plain text '.repeat(20)

    expect(getParsedMessageValue('message', value)).toBe(value)
    expect(isParsedMessageValueShortened('message', value)).toBe(false)
  })

  test('displays EIP-712 integer values as decimal strings', () => {
    const integerFieldNames = getEip712IntegerFieldNames(
      {
        SafeTx: [
          { name: 'data', type: 'bytes' },
          { name: 'operation', type: 'uint8' },
          { name: 'safeTxGas', type: 'uint256' },
          { name: 'baseGas', type: 'uint256' },
          { name: 'gasPrice', type: 'uint256' },
          { name: 'nonce', type: 'uint256' }
        ]
      },
      'SafeTx'
    )

    expect(getParsedMessageValue('safeTxGas', '0x00', integerFieldNames)).toBe('0')
    expect(getParsedMessageValue('baseGas', '0x10', integerFieldNames)).toBe('16')
    expect(getParsedMessageValue('gasPrice', '0xff', integerFieldNames)).toBe('255')
    expect(getParsedMessageValue('nonce', '0x09', integerFieldNames)).toBe('9')
  })
})
