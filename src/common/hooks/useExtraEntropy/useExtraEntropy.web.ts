import { useEffect } from 'react'

import { observeEntropySample, takeExtraEntropy } from './entropyPool'

// The two handlers are module level rather than created per mount, so that registering them is
// idempotent: addEventListener ignores a repeat of the same (type, callback, capture) triple, so
// however many consumers of this hook are mounted, each event is folded exactly once. Per-mount
// closures defeat that - each is a distinct callback, so the app-wide BiometricsProvider plus any
// screen-level consumer would fold the same sample twice, for zero extra entropy (the second fold
// follows from the first) while spending two slots of that source's budget on one event.

// ~2-4 bits per event at the ~8ms spacing a 120Hz mouse reports at: 1-2 from the position, most
// of which a smooth path gives away, and 1-2 from the jitter in the timestamp. Events further
// apart carry more each, closer to 5-8, but there is no reason to wait for them - a hundred cheap
// samples fill the pool sooner than twenty expensive ones, and cost ~1ms of CPU to fold.
const handleMouseMove = (e: MouseEvent) => {
  observeEntropySample('mousemove', `${e.clientX}-${e.clientY}-${e.timeStamp}`)
}

// Only the timing of a keystroke is folded in, never which key it was. The unpredictability
// lives in the jitter between keystrokes, worth ~6-10 bits per event and so the largest
// per-event source here. Recording the keys themselves would amount to keeping a keylog in
// memory, for entropy we already have. It also matters because someone navigating by keyboard
// alone moves the mouse rarely, or not at all.
// Its budget is its own, so the mousemove burst that fills within seconds of the page opening
// cannot spend it before the user has typed anything - see MAX_OBSERVED_SAMPLES_PER_SOURCE.
const handleKeyDown = (e: KeyboardEvent) => observeEntropySample('keydown', `${e.timeStamp}`)

/**
 * The web half of the entropy pool - see `entropyPool.ts` for what the pool is for and why it
 * exists. Here it is fed from mouse movement and keystroke timing, observed on `document`.
 *
 * Worth ~40 bits when nothing has been observed and the two clocks in `takeExtraEntropy` carry it
 * alone (~13-21 from performance.now(), being how long the page had been open, and ~26 from
 * Date.now() against an attacker who knows the day), up to the pool's 256-bit ceiling after a few
 * seconds of interaction. The per-event figures above assume Chrome's 100us timer clamp - Firefox
 * clamps to 1ms, costing ~3 bits on each timestamp.
 */
const useExtraEntropy = () => {
  // Registered on mount rather than at module scope, so importing this file where there is no
  // document stays harmless, and deliberately never removed: the pool the handlers feed is module
  // state that outlives every mount, so detaching when one consumer unmounts would stop collecting
  // while the others are still mounted. They close over nothing, so nothing is retained.
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('keydown', handleKeyDown, { passive: true })
  }, [])

  // Stable by construction, being a module-level function - the previous implementation kept the
  // last sample in React state, and that update ran on every mousemove and rippled through the
  // app-wide BiometricsProvider that consumes this hook.
  return { getExtraEntropy: takeExtraEntropy }
}

export default useExtraEntropy
