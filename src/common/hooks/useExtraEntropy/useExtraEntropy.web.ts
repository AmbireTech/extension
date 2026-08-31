import { useEffect } from 'react'

import { observeEntropySample, takeExtraEntropy } from './entropyPool'

// The two handlers are module level rather than created per mount, so that registering them is
// idempotent: addEventListener ignores a repeat of the same (type, callback, capture) triple, so
// however many consumers of this hook are mounted, each event is folded exactly once. Per-mount
// closures are distinct callbacks, so the app-wide BiometricsProvider plus any screen-level consumer
// would fold the same sample twice - for zero extra entropy, the second fold following from the
// first, while spending two slots of that source's budget on one event.

// Pointer rather than mouse events, so touch and pen count too - the extension also runs on
// touchscreen laptops and tablets, where mousemove barely fires and an on-screen keyboard gives
// little keydown either. For a mouse the two fire identically, so covering all three costs nothing.
// ~2-4 bits per event at the ~8ms spacing a 120Hz mouse reports at: 1-2 from the position, most of
// which a smooth path gives away, and 1-2 from the jitter in the timestamp. Events further apart
// carry closer to 5-8, but there is no reason to wait for them - a hundred cheap samples fill the
// pool sooner than twenty expensive ones, at ~1ms of CPU to fold. pressure is a flat constant for a
// mouse, but a sensor reading for touch and pen, and so noise that does not follow from the path.
const handlePointerMove = (e: PointerEvent) => {
  observeEntropySample('pointermove', `${e.clientX}-${e.clientY}-${e.pressure}-${e.timeStamp}`)
}

// Only the timing of a keystroke is folded in, never which key it was - recording the keys would
// amount to keeping a keylog in memory, for entropy we already have. The unpredictability lives in
// the jitter between keystrokes, worth ~6-10 bits per event and so the largest per-event source here,
// and it covers someone navigating by keyboard who moves the mouse rarely or not at all. Its budget
// is its own, so the pointermove burst that fills within seconds of the page opening cannot spend it
// before the user has typed anything - see MAX_OBSERVED_SAMPLES_PER_SOURCE.
const handleKeyDown = (e: KeyboardEvent) => observeEntropySample('keydown', `${e.timeStamp}`)

/**
 * The web half of the entropy pool - see `entropyPool.ts` for what the pool is for. Fed from pointer
 * movement (mouse, touch or pen) and keystroke timing, both observed on `document`.
 *
 * Worth ~40 bits when nothing has been observed and the two clocks in `takeExtraEntropy` carry it
 * alone (~13-21 from performance.now(), being how long the page had been open, and ~26 from
 * Date.now() against an attacker who knows the day), up to the pool's 256-bit ceiling after a few
 * seconds of interaction. The per-event figures above assume Chrome's 100us timer clamp - Firefox
 * clamps to 1ms, costing ~3 bits on each timestamp.
 */
const useExtraEntropy = () => {
  // Registered on mount rather than at module scope, so importing this file where there is no document
  // stays harmless, and deliberately never removed: the pool the handlers feed outlives every mount,
  // so detaching when one consumer unmounts would stop collecting while the others are still mounted.
  // They close over nothing, so nothing is retained.
  useEffect(() => {
    document.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('keydown', handleKeyDown, { passive: true })
  }, [])

  // Stable by construction, being a module-level function - the previous implementation kept the last
  // sample in React state, which re-rendered the app-wide BiometricsProvider on every mouse move.
  return { getExtraEntropy: takeExtraEntropy }
}

export default useExtraEntropy
