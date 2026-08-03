import { concat, keccak256, toUtf8Bytes } from 'ethers'

import { generateUuid } from '@ambire-common/utils/uuid'

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

/**
 * Reads the pool and advances it, so no two calls can hand out the same value. Named to take rather
 * than to get for that reason - this is not an idempotent read. See each platform's hook for how
 * much the pool and the two clocks are worth there.
 */
export const takeExtraEntropy = () => {
  // The uuid is only a fallback for when nothing has been observed yet. It is drawn from the same
  // CSPRNG the EntropyGenerator already uses, so unlike the pool it adds no entropy that is
  // independent of the platform randomness.
  const userEntropy = entropyPool ?? generateUuid()
  // Date.now() is an absolute wall clock, so unlike performance.now() it survives an attacker who
  // can bound when this JS context started, which is what bounds performance.now(). Both only
  // really matter on the fallback path.
  const extraEntropy = `${userEntropy}-${performance.now()}-${Date.now()}`

  // Advance the pool so the value just handed out is not the state a later call would return - one
  // leaked extraEntropy string then cannot stand in for the pool for the rest of the session.
  foldIntoEntropyPool(extraEntropy)

  return extraEntropy
}
