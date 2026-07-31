import { useCallback } from 'react'
import { GestureResponderEvent } from 'react-native'

import { generateUuid } from '@ambire-common/utils/uuid'

// The pool is kept at module level rather than in React state for two reasons:
// - it is shared, so touches collected anywhere in the app are available to whichever screen
//   later needs entropy (the web hook gets this for free by listening on `document`)
// - onTouchMove fires on every frame of a drag, and re-rendering the app root at that rate
//   would be a serious performance regression
// Capped because the app stays alive for long periods and the pool would otherwise grow
// unbounded; keccak256 in the EntropyGenerator compresses whatever it is given anyway.
const MAX_TOUCH_SAMPLES = 32
const touchSamples: string[] = []

const collectTouchEntropy = (e: GestureResponderEvent) => {
  const { pageX, pageY, timestamp } = e.nativeEvent

  touchSamples.push(`${pageX}-${pageY}-${timestamp}`)
  if (touchSamples.length > MAX_TOUCH_SAMPLES) touchSamples.shift()
}

// Spread onto the app-wide root view once - the mobile counterpart of the mousemove listener
// the web hook attaches to `document`.
// React Native registers onTouchStart/onTouchMove as bubbling events, so they fire for touches
// on any child without taking part in responder negotiation. That is what makes this safe:
// unlike a gesture-handler based observer, it can never claim (or fail to release) the touch
// responder and freeze the elements underneath.
export const entropyTouchHandlers = {
  onTouchStart: collectTouchEntropy,
  onTouchMove: collectTouchEntropy
}

const useExtraEntropy = () => {
  const getExtraEntropy = useCallback(() => {
    // The uuid is only a fallback for the (unlikely) case of not a single touch being
    // registered yet. It is drawn from the same CSPRNG the EntropyGenerator already uses,
    // so unlike the touch samples it adds no independent entropy.
    const touchEntropy = touchSamples.join('-') || generateUuid()

    return `${touchEntropy}-${performance.now()}`
  }, [])

  return { getExtraEntropy }
}

export default useExtraEntropy
