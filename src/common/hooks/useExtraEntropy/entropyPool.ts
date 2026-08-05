import { concat, keccak256, toUtf8Bytes } from 'ethers'

/**
 * A pool of unpredictable user input - the timing and position of whichever events each platform's
 * hook can observe - which `EntropyGenerator` hashes and XORs into the output of the platform
 * CSPRNG, before that output becomes a keystore main key, a seed phrase, a scrypt salt or an AES IV.
 *
 * The hypothetical problem it solves: every secret the wallet generates traces back to that one
 * CSPRNG, so if it is ever predictable - weak seeding early at boot, a cloned or restored device
 * image reusing state, a browser or OS bug - then every one of those secrets is guessable, and no
 * amount of correct crypto downstream helps. The pool is a second source that does not depend on
 * the platform randomness at all.
 *
 * It is defense in depth, not a replacement. The mixing is an XOR, which can never lower the
 * entropy of either input, so when the CSPRNG is healthy this costs nothing.
 *
 * Every observed event is folded into a running 256-bit hash rather than stored, so nothing is ever
 * evicted the way a fixed-size buffer would evict its oldest sample. Those 256 bits are the pool's
 * capacity, not its yield - what it holds grows only with input that is genuinely independent of
 * what came before, not with the number of events.
 *
 * Kept at module level so the pool survives remounts and accumulates across the lifetime of this JS
 * context, and so collecting never goes through React state, which would re-render every consumer
 * of the hook on every event.
 */
let entropyPool: string | null = null

export const foldIntoEntropyPool = (sample: string) => {
  const sampleBytes = toUtf8Bytes(sample)

  entropyPool = keccak256(entropyPool ? concat([entropyPool, sampleBytes]) : sampleBytes)

  return entropyPool
}

// A mouse or a digitizer reports at up to 120Hz, but samples 8ms apart on a smooth path are nearly
// redundant, while ones further apart carry more each. Throttling therefore keeps almost all of the
// entropy for a fraction of the work, which matters most on mobile, where this runs on the same JS
// thread as the gesture being performed.
const MIN_MS_BETWEEN_SAMPLES = 50
// The pool saturates its 256 bits within the first few dozen samples, so this is far more than it
// can ever hold and observing past it buys nothing. What it gives up: fresh input is the only thing
// that would recover the pool if its state ever leaked, since advancing it only folds in the two
// clocks, which an attacker can bound. That is a thin enough scenario not to be worth collecting for
// a whole session.
const MAX_OBSERVED_SAMPLES = 1000

// Starts before any possible reading rather than at 0, so the very first sample is never throttled.
// performance.now() is 0 at the time origin, so 0 here would mean "50ms into this JS context".
let lastSampleAt = -Infinity
let observedSamples = 0

/**
 * Folds one observed event into the pool, throttled and bounded. For collection only -
 * `takeExtraEntropy` calls `foldIntoEntropyPool` directly, because a throttled or capped fold there
 * would let two calls hand out the same value.
 */
export const observeEntropySample = (sample: string) => {
  if (observedSamples >= MAX_OBSERVED_SAMPLES) return

  // Monotonic on purpose. Date.now() can step backwards - an NTP correction, the user changing the
  // date - which would make this difference negative, keep it under the threshold, and silently drop
  // every sample until wall time caught up. performance.now() only ever moves forward.
  const now = performance.now()
  if (now - lastSampleAt < MIN_MS_BETWEEN_SAMPLES) return

  lastSampleAt = now
  observedSamples += 1
  foldIntoEntropyPool(sample)

  // For debugging: uncomment to check that events are reaching the pool at all
  // if (observedSamples === MAX_OBSERVED_SAMPLES)
  //   console.log(`[extraEntropy] full at ${MAX_OBSERVED_SAMPLES} samples, no longer observing`)
  // console.log(`[extraEntropy] ${observedSamples} samples observed so far`)
}

/**
 * Hands out a one-way hash of the pool and advances it, so no two calls can hand out the same value
 * and a leaked value tells an attacker nothing about the pool it came from. Named to take rather
 * than to get for that reason - this is not an idempotent read. See each platform's hook for how
 * much the pool and the two clocks are worth there.
 */
export const takeExtraEntropy = () => {
  // Date.now() is an absolute wall clock, so unlike performance.now() it survives an attacker who
  // can bound when this JS context started, which is what bounds performance.now(). Both only
  // really matter before anything has been observed, when they are the only entropy in the pool.
  // There is deliberately no random fallback for that case: it would have to come from the same
  // CSPRNG the EntropyGenerator already draws from, so in the one scenario this pool exists for -
  // that CSPRNG being predictable - it would be predictable too, and contribute nothing.
  // Folding them in rather than only reading them is also what advances the pool: the new state is a
  // hash of the old one, so it can never repeat, and two calls landing on the same coarsened clock
  // reading still hand out different values.
  const pool = foldIntoEntropyPool(`${performance.now()}-${Date.now()}`)

  // A hash of the pool rather than the pool itself, so one leaked extraEntropy reveals nothing about
  // the pool that produced it, and therefore cannot derive what any later call will hand out.
  const extraEntropy = keccak256(toUtf8Bytes(`take-${pool}`))

  // For debugging: uncomment to see how much had been collected when a secret was generated.
  // observedSamples 0 means nothing is being collected at all, leaving the two clocks above as the
  // only entropy here that is independent of the platform randomness.
  // console.log('[extraEntropy] taken for secret generation', { observedSamples })

  return extraEntropy
}
