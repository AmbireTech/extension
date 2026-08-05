import { concat, keccak256, toUtf8Bytes } from 'ethers'

/**
 * A pool of unpredictable user input - the timing and position of whichever events each platform's
 * hook can observe - which `EntropyGenerator` hashes and XORs into the output of the platform
 * CSPRNG, before that output becomes a keystore main key, a seed phrase, a scrypt salt or an AES IV.
 *
 * Every secret the wallet generates traces back to that one CSPRNG, so if it is ever predictable -
 * weak seeding early at boot, a cloned or restored device image, a browser or OS bug - then every
 * one of them is guessable and no amount of correct crypto downstream helps. This is a second source
 * that does not depend on the platform randomness at all. Defense in depth, not a replacement: the
 * mixing is an XOR, which can never lower the entropy of either input.
 *
 * Every observed event is folded into a running 256-bit hash rather than stored, so nothing is ever
 * evicted the way a fixed-size buffer would evict its oldest sample. Those 256 bits are the pool's
 * capacity, not its yield - what it holds grows only with input that is genuinely independent of
 * what came before, not with the number of events. Each platform's hook documents what its own
 * sources are worth.
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

// Deliberately unthrottled, capping total work instead of the rate. A fold is ~11us on V8 and so
// ~30-50us on Hermes, against an 8.3ms frame at 120Hz, while rate limiting is lossy exactly where
// events are scarcest: a mobile tap is a handful of touch events over ~100ms, of which a 50ms
// throttle keeps two or three.
//
// The pool saturates its 256 bits within the first few dozen samples, so 512 is a wide margin even if
// the per-event estimates in each hook turn out optimistic, and observing past it buys nothing. What
// it gives up: fresh input is the only thing that would recover the pool if its state ever leaked,
// since advancing it only folds in the two clocks, which an attacker can bound - a thin enough
// scenario not to be worth collecting for a whole session.
//
// Budgeted per source rather than shared, because the sources differ by orders of magnitude in rate
// and by several times in worth: pointermove fires at 60-120Hz and would drain a shared budget
// within seconds of the page opening - long before the user reaches a password field, and so before
// keydown, the richest source here at ~6-10 bits against ~2-4, ever got to contribute a single sample.
// The same split applies to the two touch sources on mobile: touchMove fires every frame of a drag,
// so a shared budget would be spent by one scroll and no later tap could ever contribute.
export const MAX_OBSERVED_SAMPLES_PER_SOURCE = 512

export type EntropySource = 'pointermove' | 'keydown' | 'touchStart' | 'touchMove'
const observedSamples: Partial<Record<EntropySource, number>> = {}

/**
 * Folds one observed event into the pool, up to that source's cap. For collection only -
 * `takeExtraEntropy` folds directly, because a capped fold there would let two calls hand out the
 * same value.
 */
export const observeEntropySample = (source: EntropySource, sample: string) => {
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
 * and a leaked value tells an attacker nothing about the pool it came from - which is why it is named
 * to take rather than to get, this is not an idempotent read. See each platform's hook for how much
 * the pool and the two clocks are worth there.
 */
export const takeExtraEntropy = () => {
  // Date.now() is an absolute wall clock, so unlike performance.now() it survives an attacker who can
  // bound when this JS context started. Both only really matter before anything has been observed,
  // when they are the only entropy in the pool - and there is deliberately no random fallback for
  // that case, because it would have to come from the very CSPRNG this pool hedges against, so in the
  // one scenario it exists for it would be predictable too. Folding them in rather than only reading
  // them is also what advances the pool, so two calls landing on the same coarsened clock reading
  // still hand out different values.
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
