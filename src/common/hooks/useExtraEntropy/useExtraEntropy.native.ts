import { GestureResponderEvent } from 'react-native'

import { observeEntropySample, takeExtraEntropy } from './entropyPool'

// ~4-8 bits per event, most of it in the sub-pixel fraction of the coordinates, which is sensor
// noise and so does not follow from the shape of the gesture the way the coordinates themselves do.
// The timestamp carries less here than the mouse timestamp does on web, because the digitizer
// samples on a fixed 60-120Hz clock and so jitters far less than a mouse polling on its own.
const collectTouchEntropy = (e: GestureResponderEvent) => {
  const { pageX, pageY, timestamp } = e.nativeEvent

  observeEntropySample('touch', `${pageX}-${pageY}-${timestamp}`)
}

// Spread onto the app-wide root view once - the mobile counterpart of the pointermove listener the
// web hook attaches to `document`. Collecting has to stay out of React state because onTouchMove
// fires on every frame of a drag.
// React Native registers onTouchStart/onTouchMove as bubbling events, so they fire for touches on any
// child without taking part in responder negotiation. That is what makes this safe: unlike a
// gesture-handler based observer, it can never claim (or fail to release) the touch responder and
// freeze the elements underneath.
export const entropyTouchHandlers = {
  onTouchStart: collectTouchEntropy,
  onTouchMove: collectTouchEntropy
}

/**
 * The mobile half of the entropy pool - see `entropyPool.ts` for what the pool is for. Fed from the
 * position and timing of touches, collected by `entropyTouchHandlers` on the app root rather than by
 * a listener this hook owns.
 *
 * Worth ~50 bits when no touch has been observed and the two clocks in `takeExtraEntropy` carry it
 * alone (~20-30 from performance.now(), being how long the app had been running, which unlike a
 * browser the runtime does not coarsen, plus ~26 from Date.now() against an attacker who knows the
 * day), and the low hundreds after a screen or two of ordinary use. It reaches the pool's 256-bit
 * ceiling less readily than web does: a tap is a handful of events where a mouse crossing a page is
 * hundreds, and there is no keystroke source to make up for it - the OS keyboard is a native overlay
 * outside the React Native view tree, so typing produces no touch events at all.
 */
const useExtraEntropy = () => ({ getExtraEntropy: takeExtraEntropy })

export default useExtraEntropy
