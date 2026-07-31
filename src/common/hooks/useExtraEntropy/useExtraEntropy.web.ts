import { concat, keccak256, toUtf8Bytes } from 'ethers'
import { useCallback, useEffect } from 'react'

import { generateUuid } from '@ambire-common/utils/uuid'

// Every observed event is folded into a running 256-bit hash rather than stored, so nothing is
// ever evicted the way a fixed-size buffer would evict its oldest sample. Those 256 bits are the
// pool's capacity, not its yield - what it actually holds grows only with input that is genuinely
// independent, not with the number of events, so a long smooth mouse path adds close to nothing.
// Kept at module level so the pool survives remounts and accumulates across the whole session,
// and so reading it does not go through React state - the previous state update ran on every
// mousemove and rippled through the app-wide BiometricsProvider that consumes this hook.
let entropyPool: string | null = null

const foldIntoEntropyPool = (sample: string) => {
  const sampleBytes = toUtf8Bytes(sample)

  entropyPool = keccak256(entropyPool ? concat([entropyPool, sampleBytes]) : sampleBytes)
}

const useExtraEntropy = () => {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      foldIntoEntropyPool(`${e.clientX}-${e.clientY}-${e.timeStamp}`)
    }

    // Only the timing of a keystroke is folded in, never which key it was. The unpredictability
    // lives in the jitter between keystrokes, while recording the keys themselves would amount
    // to keeping a keylog in memory. It matters because someone navigating by keyboard alone
    // moves the mouse rarely, or not at all.
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

    return `${userEntropy}-${performance.now()}`
  }, [])

  return { getExtraEntropy }
}

export default useExtraEntropy
