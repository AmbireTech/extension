import { parseUnits } from 'ethers'

import {
  getNiceSliderStep,
  getSliderAmountFieldValue,
  parseSliderAmount,
  snapSliderAmount,
  toFiatSliderAmount
} from './amountSlider'

describe('getNiceSliderStep', () => {
  it('picks a 1-2-5 step that splits the range into at least 100 amounts', () => {
    expect(getNiceSliderStep(100000n)).toBe(1000n) // $1,000 in cents -> $10
    expect(getNiceSliderStep(127400n)).toBe(1000n) // $1,274 in cents -> $10
    expect(getNiceSliderStep(300000n)).toBe(2000n) // $3,000 in cents -> $20
    expect(getNiceSliderStep(600000n)).toBe(5000n) // $6,000 in cents -> $50
    expect(getNiceSliderStep(parseUnits('0.0372', 18))).toBe(parseUnits('0.0002', 18))
    expect(getNiceSliderStep(parseUnits('433.93', 18))).toBe(parseUnits('2', 18))
  })
  it('never moves by more than 1% of the range, so every whole percentage is reachable', () => {
    ;[199n, 4999n, 19999n, 99999n, 100148n, parseUnits('433.93', 18)].forEach((maximumValue) => {
      const step = getNiceSliderStep(maximumValue)
      expect(step * 100n).toBeLessThanOrEqual(maximumValue)
      expect(step * 100n * 5n).toBeGreaterThan(maximumValue)
    })
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
      parseUnits('0.0114', 18)
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
    const unevenMax = 101700n // $1,017 in cents, moving in $10 steps
    expect(snapSliderAmount(101600n, unevenMax)).toBe(101000n)
  })
  it('lets a drag across the track land on every whole percentage', () => {
    // The 433.93 stkWALLET balance the slider used to skip 42% on, dragged a slider step at a time
    const maximumValue = parseUnits('433.93', 18)
    const percentages = new Set<number>()
    for (let step = 0n; step <= 10000n; step += 1n) {
      const amount = snapSliderAmount((maximumValue * step) / 10000n, maximumValue)
      percentages.add(Math.round(Number((amount * 10000n) / maximumValue) / 100))
    }

    expect(percentages.size).toBe(101)
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

describe('parseSliderAmount', () => {
  it('parses the field text in the unit given', () => {
    expect(parseSliderAmount('12.5', 2)).toBe(1250n)
    expect(parseSliderAmount('', 18)).toBe(0n)
  })
  it('drops the decimals the unit has no room for instead of failing', () => {
    expect(parseSliderAmount('12.567', 2)).toBe(1256n)
    expect(parseSliderAmount('.5', 2)).toBe(50n)
  })
})

describe('toFiatSliderAmount', () => {
  it('prices a token amount in cents, rounding down', () => {
    expect(toFiatSliderAmount(parseUnits('2', 18), 18, 3660.27)).toBe(732054n)
    expect(toFiatSliderAmount(parseUnits('1', 6), 6, 0.99785)).toBe(99n)
  })
  it('is zero without a price', () => {
    expect(toFiatSliderAmount(parseUnits('2', 18), 18, undefined)).toBe(0n)
    expect(toFiatSliderAmount(parseUnits('2', 18), 18, 0)).toBe(0n)
  })
})
