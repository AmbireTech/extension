import { getMsUntilNextSecond, getSecondsUntilClose } from './helpers'

describe('getSecondsUntilClose', () => {
  it('counts whole seconds, rounding up', () => {
    expect(getSecondsUntilClose(5000, 0)).toBe(5)
    expect(getSecondsUntilClose(5000, 1)).toBe(5)
    expect(getSecondsUntilClose(5000, 1000)).toBe(4)
    expect(getSecondsUntilClose(5000, 2500)).toBe(3)
    expect(getSecondsUntilClose(5000, 4999)).toBe(1)
  })

  it('never goes below 1, even once the close time has passed', () => {
    expect(getSecondsUntilClose(5000, 5000)).toBe(1)
    expect(getSecondsUntilClose(5000, 9000)).toBe(1)
  })
})

describe('getMsUntilNextSecond', () => {
  it('waits a full second when exactly on a second', () => {
    expect(getMsUntilNextSecond(5000, 0)).toBe(1000)
    expect(getMsUntilNextSecond(5000, 1000)).toBe(1000)
  })

  it('waits only for the rest of the current second when started mid-way', () => {
    expect(getMsUntilNextSecond(5000, 2500)).toBe(500)
    expect(getMsUntilNextSecond(5000, 4999)).toBe(1)
  })

  it('waits until the shown second actually changes', () => {
    const closesAt = 5000
    const now = 2300
    const next = now + getMsUntilNextSecond(closesAt, now)

    expect(getSecondsUntilClose(closesAt, next)).toBe(getSecondsUntilClose(closesAt, now) - 1)
  })
})
