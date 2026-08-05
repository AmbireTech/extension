import { MAX_OBSERVED_SAMPLES, takeExtraEntropy } from './entropyPool'

// Both clocks are folded into every value handed out, so they have to be pinned for any two values to
// be comparable at all.
beforeEach(() => {
  jest.spyOn(performance, 'now').mockReturnValue(12.5)
  jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
})

afterEach(() => {
  jest.restoreAllMocks()
})

// Gives each call a brand new, empty pool. The real one is module state that never resets, so there
// is no other way to observe two samples from the same starting point and compare.
const takeFromFreshPool = (fold: (pool: typeof import('./entropyPool')) => void) => {
  jest.resetModules()
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const freshPool = require('./entropyPool') as typeof import('./entropyPool')

  fold(freshPool)

  return freshPool.takeExtraEntropy()
}

describe('entropyPool', () => {
  it('hands out a hash rather than the pool, and a different one on every call', () => {
    const first = takeExtraEntropy()
    const second = takeExtraEntropy()

    expect(first).toHaveLength(66)
    expect(first.startsWith('0x')).toBe(true)
    // The clocks are pinned, so the only thing that can make these differ is the ratchet
    expect(second).not.toEqual(first)
  })

  // The test above would still pass if the fold threw its input away, because the ratchet keeps the
  // pool changing on its own. This is the one that checks the mouse and touch data actually lands in
  // the pool.
  it('folds the observed sample into the pool, and nothing but the sample', () => {
    const afterFolding = (sample: string) =>
      takeFromFreshPool((pool) => pool.foldIntoEntropyPool(sample))

    // Fold the same thing twice, get the same value: the pool holds nothing but what it was given.
    expect(afterFolding('100-200-1234.5')).toEqual(afterFolding('100-200-1234.5'))
    // Change one digit, get a different value: what it was given is not being ignored.
    expect(afterFolding('100-200-1234.5')).not.toEqual(afterFolding('100-200-1234.6'))
  })

  it('observes every sample it is given, up to the cap, and nothing past it', () => {
    const afterObserving = (...samples: string[]) =>
      takeFromFreshPool((pool) => samples.forEach((sample) => pool.observeEntropySample(sample)))

    // Differing from an untouched pool means samples get through at all, which is what would break
    // if the cap were ever inverted, and that a burst is kept rather than rate limited away
    expect(afterObserving('100-200-1')).not.toEqual(afterObserving())
    expect(afterObserving('100-200-1', '101-201-2')).not.toEqual(afterObserving('100-200-1'))

    // Past the cap the pool stops changing, so a long session cannot keep folding forever
    const upToTheCap = Array.from({ length: MAX_OBSERVED_SAMPLES }, (_, i) => `100-200-${i}`)

    expect(afterObserving(...upToTheCap, 'past-the-cap')).toEqual(afterObserving(...upToTheCap))
  })
})
