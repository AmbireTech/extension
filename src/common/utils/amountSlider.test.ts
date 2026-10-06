import { parseUnits } from 'ethers'

import { getSliderAmountFieldValue } from './amountSlider'

const max = parseUnits('1000', 18)

describe('getSliderAmountFieldValue', () => {
  it('cuts the amount down to 2 decimals', () => {
    expect(getSliderAmountFieldValue(parseUnits('413.018213456789', 18), max, 18)).toBe('413.01')
  })
  it('drops the decimal of a whole amount', () => {
    expect(getSliderAmountFieldValue(parseUnits('413.004', 18), max, 18)).toBe('413')
  })
  it('keeps the maximum exact', () => {
    const exactMax = parseUnits('1274747.643219', 18)
    expect(getSliderAmountFieldValue(exactMax, exactMax, 18)).toBe('1274747.643219')
  })
  it('keeps an amount the cut would wipe out', () => {
    expect(getSliderAmountFieldValue(parseUnits('0.0004', 18), max, 18)).toBe('0.0004')
  })
  it('keeps more decimals on a balance too small for 2 to slide smoothly', () => {
    const smallMax = parseUnits('0.0372', 18)
    expect(getSliderAmountFieldValue((smallMax * 50n) / 100n, smallMax, 18)).toBe('0.0186')
    expect(getSliderAmountFieldValue((smallMax * 75n) / 100n, smallMax, 18)).toBe('0.0279')
    expect(getSliderAmountFieldValue((smallMax * 333n) / 1000n, smallMax, 18)).toBe('0.01238')
  })
  it('leaves units with 2 decimals or fewer alone', () => {
    expect(getSliderAmountFieldValue(56935n, 100000n, 2)).toBe('569.35')
    expect(getSliderAmountFieldValue(7n, 100n, 0)).toBe('7')
  })
})
