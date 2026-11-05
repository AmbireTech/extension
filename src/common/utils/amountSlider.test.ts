import { parseUnits } from 'ethers'

import { getNiceSliderStep, getSliderAmountFieldValue, snapSliderAmount } from './amountSlider'

describe('getNiceSliderStep', () => {
  it('picks a 1-2-5 step that splits the range into at most 100 amounts', () => {
    expect(getNiceSliderStep(100000n)).toBe(1000n) // $1,000 in cents -> $10
    expect(getNiceSliderStep(127400n)).toBe(2000n) // $1,274 in cents -> $20
    expect(getNiceSliderStep(300000n)).toBe(5000n) // $3,000 in cents -> $50
    expect(getNiceSliderStep(parseUnits('0.0372', 18))).toBe(parseUnits('0.0005', 18))
    expect(getNiceSliderStep(parseUnits('3.2', 18))).toBe(parseUnits('0.05', 18))
  })
  it('moves up a power of ten when no 1-2-5 multiple of the current one is enough', () => {
    expect(getNiceSliderStep(60001n)).toBe(1000n)
  })
  it('moves by the smallest denomination on a range too small to split', () => {
    expect(getNiceSliderStep(30n)).toBe(1n)
    expect(getNiceSliderStep(100n)).toBe(1n)
    expect(getNiceSliderStep(0n)).toBe(1n)
  })
})

describe('snapSliderAmount', () => {
  const max = 100000n // $1,000 in cents, moving in $10 steps

  it('rounds to the nearest step', () => {
    expect(snapSliderAmount(1112n, max)).toBe(1000n)
    expect(snapSliderAmount(1500n, max)).toBe(2000n)
    expect(snapSliderAmount(parseUnits('0.01137', 18), parseUnits('0.0372', 18))).toBe(
      parseUnits('0.0115', 18)
    )
  })
  it('keeps zero and the maximum exact', () => {
    const exactMax = parseUnits('1274747.643219', 18)
    expect(snapSliderAmount(0n, exactMax)).toBe(0n)
    expect(snapSliderAmount(exactMax, exactMax)).toBe(exactMax)
    expect(snapSliderAmount(exactMax + 1n, exactMax)).toBe(exactMax)
  })
  it('lets an amount close to zero round down to it', () => {
    expect(snapSliderAmount(400n, max)).toBe(0n)
  })
  it('stays on the last step below a maximum it would round past', () => {
    const unevenMax = 101500n // $1,015 in cents, moving in $20 steps
    expect(snapSliderAmount(101200n, unevenMax)).toBe(100000n)
  })
  it('leaves a range too small to split as it is', () => {
    expect(snapSliderAmount(17n, 30n)).toBe(17n)
  })
})

describe('getSliderAmountFieldValue', () => {
  it('formats the amount in whole units', () => {
    expect(getSliderAmountFieldValue(parseUnits('0.0115', 18), 18)).toBe('0.0115')
    expect(getSliderAmountFieldValue(56935n, 2)).toBe('569.35')
  })
  it('drops the decimal of a whole amount', () => {
    expect(getSliderAmountFieldValue(parseUnits('413', 18), 18)).toBe('413')
    expect(getSliderAmountFieldValue(7n, 0)).toBe('7')
  })
  it('keeps an exact amount exact', () => {
    expect(getSliderAmountFieldValue(parseUnits('1274747.643219', 18), 18)).toBe('1274747.643219')
  })
})
