import { exceedsQrRequestSizeLimit, exceedsQrTypedDataDisplayLimits } from './exceedsQrDeviceLimits'

/**
 * A one-field message whose indented JSON is exactly `bytes` long.
 */
const getMessageOfDisplaySize = (bytes: number) => {
  const overhead = JSON.stringify({ data: '' }, null, 2).length

  return { data: 'a'.repeat(bytes - overhead) }
}

describe('exceedsQrTypedDataDisplayLimits', () => {
  it('fits a message right at the 4096 byte limit', () => {
    expect(exceedsQrTypedDataDisplayLimits(getMessageOfDisplaySize(4096))).toBe(false)
  })

  it('does not fit a message right over the 4096 byte limit', () => {
    expect(exceedsQrTypedDataDisplayLimits(getMessageOfDisplaySize(4097))).toBe(true)
  })

  it('counts bytes, not characters', () => {
    const message = getMessageOfDisplaySize(4096)
    // "é" takes 2 bytes, so replacing one character pushes the message over by a byte
    const withMultiByteCharacter = { data: `é${message.data.slice(1)}` }

    expect(exceedsQrTypedDataDisplayLimits(withMultiByteCharacter)).toBe(true)
  })

  it('does not fit a short message with more than 64 values', () => {
    // the message itself, the array and its items
    const withItems = (count: number) => ({ items: Array.from({ length: count }, (_, i) => i) })

    expect(exceedsQrTypedDataDisplayLimits(withItems(62))).toBe(false)
    expect(exceedsQrTypedDataDisplayLimits(withItems(63))).toBe(true)
  })

  it('counts nested values', () => {
    // message + 2 orders, each with itself and 31 values = 1 + 2 * 32 = 65
    const order = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`field${i}`, i]))

    expect(exceedsQrTypedDataDisplayLimits({ first: order, second: order })).toBe(true)
  })

  it('does not report a message that has nothing to show', () => {
    expect(exceedsQrTypedDataDisplayLimits(undefined)).toBe(false)
  })
})

describe('exceedsQrRequestSizeLimit', () => {
  it('fits a request right at the 14336 byte limit', () => {
    expect(exceedsQrRequestSizeLimit(14336)).toBe(false)
  })

  it('does not fit a request right over the 14336 byte limit', () => {
    expect(exceedsQrRequestSizeLimit(14337)).toBe(true)
  })
})
