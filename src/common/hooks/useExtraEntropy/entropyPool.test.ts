import { takeExtraEntropy } from './entropyPool'

// The pool is a keccak256 hash and is handed out first, so it is the leading 66 characters.
const poolHashOf = (extraEntropy: string) => extraEntropy.slice(0, 66)

describe('entropyPool', () => {
  // Runs first on purpose: nothing has been folded in yet, which is the only moment the clocks carry
  // the string alone, and it leaves the pool primed for the assertion below.
  it('carries the clocks alone before anything has been observed', () => {
    expect(takeExtraEntropy().startsWith('0x')).toBe(false)
  })

  // Covers the fold too: the only thing that has ever folded into the pool at this point is the
  // ratchet in the call above, so a 32-byte hash here means both worked.
  it('advances the pool on every read, so no two calls can hand out the same value', () => {
    const first = poolHashOf(takeExtraEntropy())
    const second = poolHashOf(takeExtraEntropy())

    expect(first).toHaveLength(66)
    expect(first.startsWith('0x')).toBe(true)
    expect(second).not.toEqual(first)
  })

  // The tests above would still pass if the fold threw its input away, because the ratchet keeps the
  // pool changing on its own. This is the one that checks the mouse and touch data actually lands in
  // the pool.
  it('folds the observed sample into the pool, and nothing but the sample', () => {
    const poolAfterFolding = (sample: string) => {
      // Gives each call a brand new, empty pool. The real one is module state that never resets, so
      // there is no other way to fold two samples from the same starting point and compare.
      jest.resetModules()
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const freshPool = require('./entropyPool')

      freshPool.foldIntoEntropyPool(sample)

      return poolHashOf(freshPool.takeExtraEntropy())
    }

    // Fold the same thing twice, get the same hash: the pool holds nothing but what it was given.
    expect(poolAfterFolding('100-200-1234.5')).toEqual(poolAfterFolding('100-200-1234.5'))
    // Change one digit, get a different hash: what it was given is not being ignored.
    expect(poolAfterFolding('100-200-1234.5')).not.toEqual(poolAfterFolding('100-200-1234.6'))
  })

  it('throttles a burst, so a stream at the display refresh rate is not all kept', () => {
    const poolAfterObserving = (...samples: string[]) => {
      jest.resetModules()
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const freshPool = require('./entropyPool')

      samples.forEach((sample) => freshPool.observeEntropySample(sample))

      return poolHashOf(freshPool.takeExtraEntropy())
    }

    const afterOne = poolAfterObserving('100-200-1')

    // A hash rather than a clock means the sample got through at all, which is what would break if
    // the cap on how many to observe were ever inverted
    expect(afterOne.startsWith('0x')).toBe(true)
    // Three back-to-back samples land inside one throttle window, so only the first is kept
    expect(poolAfterObserving('100-200-1', '101-201-2', '102-202-3')).toEqual(afterOne)
  })
})
