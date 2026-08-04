import { useEffect } from 'react'

import { observeEntropySample, takeExtraEntropy } from './entropyPool'

/**
 * The web half of the entropy pool - see `entropyPool.ts` for what the pool is for and why it
 * exists. Here it is fed from mouse movement and keystroke timing, observed on `document`.
 *
 * Worth ~40 bits when nothing has been observed and the two clocks in `takeExtraEntropy` carry it
 * alone (~13-21 from performance.now(), being how long the page had been open, and ~26 from
 * Date.now() against an attacker who knows the day), up to the pool's 256-bit ceiling after a few
 * seconds of interaction. The per-event figures below assume Chrome's 100us timer clamp - Firefox
 * clamps to 1ms, costing ~3 bits on each timestamp.
 */
const useExtraEntropy = () => {
  useEffect(() => {
    // ~5-8 bits per event: 2-4 from the position, most of which a smooth path gives away, and
    // 3-4 from the jitter in the timestamp.
    const handleMouseMove = (e: MouseEvent) => {
      observeEntropySample(`${e.clientX}-${e.clientY}-${e.timeStamp}`)
    }

    // Only the timing of a keystroke is folded in, never which key it was. The unpredictability
    // lives in the jitter between keystrokes, worth ~6-10 bits per event and so the largest
    // per-event source here. Recording the keys themselves would amount to keeping a keylog in
    // memory, for entropy we already have. It also matters because someone navigating by keyboard
    // alone moves the mouse rarely, or not at all.
    const handleKeyDown = (e: KeyboardEvent) => observeEntropySample(`${e.timeStamp}`)

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('keydown', handleKeyDown, { passive: true })

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Stable by construction, being a module-level function - the previous implementation kept the
  // last sample in React state, and that update ran on every mousemove and rippled through the
  // app-wide BiometricsProvider that consumes this hook.
  return { getExtraEntropy: takeExtraEntropy }
}

export default useExtraEntropy
