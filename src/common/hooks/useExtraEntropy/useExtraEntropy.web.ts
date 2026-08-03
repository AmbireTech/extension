import { concat, keccak256, toUtf8Bytes } from 'ethers'
import { useCallback, useEffect } from 'react'

import { generateUuid } from '@ambire-common/utils/uuid'

// Every observed event is folded into a running 256-bit hash rather than stored, so nothing is
// ever evicted the way a fixed-size buffer would evict its oldest sample. Those 256 bits are the
// pool's capacity, not its yield - what it actually holds grows only with input that is genuinely
// independent of what came before, not with the number of events. On a smooth mouse path the next
// position is largely predictable from the previous ones and adds little, but the timing of each
// event does not follow from the path's geometry, so a few seconds of real interaction is still
// enough to saturate the pool.
// Kept at module level so the pool survives remounts and accumulates across the lifetime of this
// JS context (the popup and the tab each keep their own), and so reading it does not go through
// React state - the previous state update ran on every mousemove and rippled through the app-wide
// BiometricsProvider that consumes this hook.
let entropyPool: string | null = null

const foldIntoEntropyPool = (sample: string) => {
  const sampleBytes = toUtf8Bytes(sample)

  entropyPool = keccak256(entropyPool ? concat([entropyPool, sampleBytes]) : sampleBytes)
}

/**
 * Collects unpredictable user input - mouse movement and keystroke timing - into an entropy pool,
 * and hands it out as a string that `EntropyGenerator` hashes and XORs into the output of
 * `crypto.getRandomValues()`, before that output becomes a keystore main key, a seed phrase, a
 * scrypt salt or an AES IV.
 *
 * The hypothetical problem it solves: every secret the wallet generates traces back to the
 * platform CSPRNG, so if that source is ever predictable - weak seeding early at boot, a cloned
 * VM or container reusing state, a browser or OS bug - then every one of those secrets is
 * guessable, and no amount of correct crypto downstream helps. The pool is a second source that
 * does not depend on the platform randomness at all, so an attacker who can predict
 * `crypto.getRandomValues()` is still left having to guess when the user moved the mouse and
 * typed, to within a hundred microseconds.
 *
 * It is defense in depth, not a replacement. The mixing is an XOR, which can never lower the
 * entropy of either input, so when the CSPRNG is healthy this costs nothing and the output is
 * already at full strength - the pool only matters in the case where the CSPRNG is not.
 *
 * Total is ~40 bits when nothing has been observed and the two clocks carry it alone, up to the
 * pool's 256-bit ceiling after a few seconds of interaction. Per-step shares are noted inline and
 * assume Chrome's 100us timer clamp - Firefox clamps to 1ms, costing ~3 bits on each timestamp.
 */
const useExtraEntropy = () => {
  useEffect(() => {
    // ~5-8 bits per event: 2-4 from the position, most of which a smooth path gives away, and
    // 3-4 from the jitter in the timestamp.
    const handleMouseMove = (e: MouseEvent) => {
      foldIntoEntropyPool(`${e.clientX}-${e.clientY}-${e.timeStamp}`)
    }

    // Only the timing of a keystroke is folded in, never which key it was. The unpredictability
    // lives in the jitter between keystrokes, worth ~6-10 bits per event and so the largest
    // per-event source here. Recording the keys themselves would amount to keeping a keylog in
    // memory, for entropy we already have. It also matters because someone navigating by keyboard
    // alone moves the mouse rarely, or not at all.
    const handleKeyDown = (e: KeyboardEvent) => foldIntoEntropyPool(`${e.timeStamp}`)

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('keydown', handleKeyDown, { passive: true })

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const getExtraEntropy = useCallback(() => {
    // The uuid is only a fallback for when nothing has been observed yet. It is drawn from the
    // same CSPRNG the EntropyGenerator already uses, so unlike the pool it adds no entropy that
    // is independent of the platform randomness.
    const userEntropy = entropyPool ?? generateUuid()
    // ~13-21 bits from performance.now() (how long the page had been open) and ~26 from Date.now()
    // against an attacker who knows the day. Being an absolute wall clock, Date.now() survives one
    // who can bound when the page was opened, which bounds performance.now(). Both only really
    // matter on the fallback path.
    const extraEntropy = `${userEntropy}-${performance.now()}-${Date.now()}`

    // Advance the pool so the value just handed out is not the state a later call would return -
    // one leaked extraEntropy string then cannot stand in for the pool for the rest of the session.
    foldIntoEntropyPool(extraEntropy)

    return extraEntropy
  }, [])

  return { getExtraEntropy }
}

export default useExtraEntropy
