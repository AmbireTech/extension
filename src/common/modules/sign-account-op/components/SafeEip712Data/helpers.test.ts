import { getSafeEip712DataValue, getSafeEip712HashRows } from './helpers'

const safeEip712Data = {
  domain: {
    chainId: '1',
    verifyingContract: '0x1111111111111111111111111111111111111111'
  },
  types: {
    SafeTx: [{ name: 'to', type: 'address' }]
  },
  message: {
    to: '0x2222222222222222222222222222222222222222'
  },
  primaryType: 'SafeTx',
  safeTxHash: '0x01',
  domainHash: '0x02',
  messageHash: '0x03'
}

describe('getSafeEip712DataValue', () => {
  test('returns a complete Safe EIP-712 preview', () => {
    expect(getSafeEip712DataValue(safeEip712Data)).toEqual(safeEip712Data)
  })

  test('rejects an incomplete Safe EIP-712 preview', () => {
    const { messageHash, ...incompleteSafeEip712Data } = safeEip712Data

    expect(messageHash).toBeTruthy()
    expect(getSafeEip712DataValue(incompleteSafeEip712Data)).toBeNull()
  })

  test('returns a Safe message EIP-712 preview', () => {
    const { safeTxHash, ...safeMessageEip712Data } = {
      ...safeEip712Data,
      safeMessageHash: '0x04'
    }

    expect(safeTxHash).toBeTruthy()
    expect(getSafeEip712DataValue(safeMessageEip712Data)).toEqual(safeMessageEip712Data)
  })
})

describe('getSafeEip712HashRows', () => {
  test('returns Safe message hashes in display order', () => {
    const { safeTxHash, ...safeMessageEip712Data } = {
      ...safeEip712Data,
      safeMessageHash: '0x04'
    }
    const data = getSafeEip712DataValue(safeMessageEip712Data)

    expect(safeTxHash).toBeTruthy()
    expect(data && getSafeEip712HashRows(data)).toEqual([
      ['safeMessageHash', '0x04'],
      ['domainHash', '0x02'],
      ['messageHash', '0x03']
    ])
  })
})
