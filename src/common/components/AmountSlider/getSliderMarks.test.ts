import { getSliderMarks, SLIDER_STEPS } from './getSliderMarks'

const EVENLY_SPACED_STEPS = [0n, 2500n, 5000n, 7500n, SLIDER_STEPS]

describe('getSliderMarks', () => {
  describe('default quarters', () => {
    // A token with no balance becomes the "from" token after swapping from and to
    it('keeps the dots apart on a zero maximum', () => {
      const marks = getSliderMarks({ maximumValue: 0n, tierOffset: 0n })

      expect(new Set(marks.map(({ key }) => key)).size).toBe(5)
      expect(marks.map(({ steps }) => steps)).toEqual(EVENLY_SPACED_STEPS)
    })

    it('keeps the dots apart on a maximum of a few units, where quarters share an amount', () => {
      const marks = getSliderMarks({ maximumValue: 3n, tierOffset: 0n })

      expect(marks.map(({ amount }) => amount)).toEqual([0n, 0n, 1n, 2n, 3n])
      expect(new Set(marks.map(({ key }) => key)).size).toBe(5)
      expect(marks.map(({ steps }) => steps)).toEqual(EVENLY_SPACED_STEPS)
    })

    it('keeps the same keys when the maximum changes', () => {
      const keysFor = (maximumValue: bigint) =>
        getSliderMarks({ maximumValue, tierOffset: 0n }).map(({ key }) => key)

      expect(keysFor(0n)).toEqual(keysFor(10n ** 18n))
    })

    it('snaps to the exact quarter amounts', () => {
      const marks = getSliderMarks({ maximumValue: 1000n, tierOffset: 0n })

      expect(marks.map(({ amount }) => amount)).toEqual([0n, 250n, 500n, 750n, 1000n])
      expect(marks.map(({ steps }) => steps)).toEqual(EVENLY_SPACED_STEPS)
    })
  })

  describe('caller marks', () => {
    it('places them by amount and drops the ones outside the draggable range', () => {
      const marks = getSliderMarks({
        marks: [{ value: 50n }, { value: 150n, tooltipId: 'tier-2' }, { value: 400n }],
        maximumValue: 200n,
        tierOffset: 50n
      })

      expect(marks.map(({ key, amount, steps }) => ({ key, amount, steps }))).toEqual([
        { key: '0', amount: 0n, steps: 0n },
        { key: 'tier-2', amount: 100n, steps: 5000n }
      ])
    })
  })
})
