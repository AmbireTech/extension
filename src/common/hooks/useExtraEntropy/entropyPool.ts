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

// Every event a platform reports is folded, deliberately unthrottled. A fold measures ~11us on V8
// and so roughly 30-50us on Hermes, against an 8.3ms frame at 120Hz - a tenth of a percent of the
// frame - while rate limiting hurts exactly where events are scarcest: a mobile tap is only a handful
// of touch events over ~100ms, so a 50ms throttle would keep two or three of them and throw the rest
// away. Reaching a full pool in the first second of interaction is worth far more than the CPU that
// costs, so the cap below bounds the total work instead of the rate.
//
// The pool saturates its 256 bits within the first few dozen samples, so this leaves a wide margin
// even if the per-event estimates in each hook turn out optimistic, and observing past it buys
// nothing. What it gives up: fresh input is the only thing that would recover the pool if its state
// ever leaked, since advancing it only folds in the two clocks, which an attacker can bound. That is
// a thin enough scenario not to be worth collecting for a whole session.
//
// Budgeted per source rather than shared, because the sources differ by orders of magnitude in rate
// and by several times in worth: pointermove fires at 60-120Hz and would drain a shared budget
// within seconds of the page opening - long before the user reaches a password field, and so before
// keydown, the richest source here at ~6-10 bits against ~2-4, ever got to contribute a single sample.
export const MAX_OBSERVED_SAMPLES_PER_SOURCE = 512

const observedSamples: Record<string, number> = {}

/**
 * Folds one observed event into the pool, up to that source's cap. For collection only -
 * `takeExtraEntropy` calls `foldIntoEntropyPool` directly, because a capped fold there would let two
 * calls hand out the same value.
 */
export const observeEntropySample = (source: string, sample: string) => {
  const observedForSource = observedSamples[source] ?? 0

  if (observedForSource >= MAX_OBSERVED_SAMPLES_PER_SOURCE) return

  observedSamples[source] = observedForSource + 1
  foldIntoEntropyPool(sample)

  // For debugging: uncomment to check that events are reaching the pool at all
  // if (observedSamples[source] === MAX_OBSERVED_SAMPLES_PER_SOURCE)
  //   console.log(`[extraEntropy] ${source} full at ${MAX_OBSERVED_SAMPLES_PER_SOURCE}, no longer observing it`)
  // console.log(`[extraEntropy] ${observedSamples[source]} ${source} samples observed so far`)
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

  // For debugging: uncomment to see how much had been collected from each source when a secret was
  // generated. An empty observedSamples means nothing is being collected at all, leaving the two
  // clocks above as the only entropy here that is independent of the platform randomness.
  // console.log('[extraEntropy] taken for secret generation', { observedSamples })

  return extraEntropy
}
