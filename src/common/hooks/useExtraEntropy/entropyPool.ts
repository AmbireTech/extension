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
}

// A mouse or a digitizer reports at up to 120Hz, but samples 8ms apart on a smooth path are nearly
// redundant, while ones further apart carry more each. Throttling therefore keeps almost all of the
// entropy for a fraction of the work, which matters most on mobile, where this runs on the same JS
// thread as the gesture being performed.
const MIN_MS_BETWEEN_SAMPLES = 50
// The pool saturates its 256 bits within the first few dozen samples, so this is far more than it
// can ever hold and observing past it buys nothing. What it gives up: fresh input is the only thing
// that would recover the pool if its state ever leaked, since the ratchet derives its input from the
// pool itself. That is a thin enough scenario not to be worth collecting for a whole session.
const MAX_OBSERVED_SAMPLES = 1000

let lastSampleAt = 0
let observedSamples = 0

/**
 * Folds one observed event into the pool, throttled and bounded. For collection only - the ratchet in
 * `takeExtraEntropy` calls `foldIntoEntropyPool` directly, because skipping a fold there would let
 * two calls hand out the same value.
 */
export const observeEntropySample = (sample: string) => {
  if (observedSamples >= MAX_OBSERVED_SAMPLES) return

  const now = Date.now()
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
 * Reads the pool and advances it, so no two calls can hand out the same value. Named to take rather
 * than to get for that reason - this is not an idempotent read. See each platform's hook for how
 * much the pool and the two clocks are worth there.
 */
export const takeExtraEntropy = () => {
  // Date.now() is an absolute wall clock, so unlike performance.now() it survives an attacker who
  // can bound when this JS context started, which is what bounds performance.now(). Both only
  // really matter before anything has been observed, when they carry the whole string. There is
  // deliberately no random fallback for that case: it would have to come from the same CSPRNG the
  // EntropyGenerator already draws from, so in the one scenario this pool exists for - that CSPRNG
  // being predictable - it would be predictable too, and contribute nothing.
  const clocks = `${performance.now()}-${Date.now()}`
  const extraEntropy = entropyPool ? `${entropyPool}-${clocks}` : clocks

  // For debugging: uncomment to see what a secret was generated with. fromPool false means it went
  // down the fallback path, with the two clocks as the only entropy independent of the platform
  // randomness, and observedSamples 0 means nothing is being collected at all.
  // console.log('[extraEntropy] taken for secret generation', {
  //   observedSamples,
  //   fromPool: extraEntropy !== clocks
  // })

  // Advance the pool so the value just handed out is not the state a later call would return - one
  // leaked extraEntropy string then cannot stand in for the pool for the rest of the session.
  foldIntoEntropyPool(extraEntropy)

  return extraEntropy
}
