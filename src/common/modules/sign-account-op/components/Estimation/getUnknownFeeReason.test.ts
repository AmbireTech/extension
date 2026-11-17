import getUnknownFeeReason from './getUnknownFeeReason'

describe('getUnknownFeeReason', () => {
  it('names the native token when the fee could not be worked out without its price', () => {
    expect(getUnknownFeeReason([], 'ETH')).toBe('No ETH price to calculate the fee')
  })

  it('gives no reason when the native token has a price', () => {
    expect(getUnknownFeeReason([], null)).toBeNull()
  })

  it('gives no reason when the fee was worked out, e.g. the balance just cannot cover it', () => {
    expect(getUnknownFeeReason([{ type: 'slow' }], 'ETH')).toBeNull()
  })

  it('gives no reason while the fee is not calculated yet', () => {
    expect(getUnknownFeeReason(undefined, 'ETH')).toBeNull()
  })
})
