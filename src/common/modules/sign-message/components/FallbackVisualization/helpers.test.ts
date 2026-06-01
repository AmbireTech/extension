import {
  EIP712_DATA_PREVIEW_MAX_LENGTH,
  getEip712IntegerFieldNames,
  getParsedMessageValue
} from './helpers'

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
