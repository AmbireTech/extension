import { concat, keccak256, toUtf8Bytes } from 'ethers'
import { useCallback } from 'react'
import { GestureResponderEvent } from 'react-native'

import { generateUuid } from '@ambire-common/utils/uuid'

// Every touch is folded into a running 256-bit hash rather than stored, so nothing is ever
// evicted the way a fixed-size buffer would evict its oldest sample. Those 256 bits are the
// pool's capacity, not its yield - what it holds grows only with input that is genuinely
// independent, not with the number of events, so a long smooth drag adds close to nothing.
// Kept at module level so touches collected anywhere in the app reach whichever screen later
// needs entropy, and so collecting never goes through React state - onTouchMove fires on every
// frame of a drag and re-rendering the app root at that rate would be a real regression.
// Note there is no keystroke source here as there is on web: the OS keyboard is a native overlay
// outside the React Native view tree, so typing produces no touch events at all.
let entropyPool: string | null = null

const foldIntoEntropyPool = (sample: string) => {
  const sampleBytes = toUtf8Bytes(sample)

  entropyPool = keccak256(entropyPool ? concat([entropyPool, sampleBytes]) : sampleBytes)
}

const collectTouchEntropy = (e: GestureResponderEvent) => {
  const { pageX, pageY, timestamp } = e.nativeEvent

  foldIntoEntropyPool(`${pageX}-${pageY}-${timestamp}`)
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
    // The uuid is only a fallback for the (unlikely) case of not a single touch being registered
    // yet. It is drawn from the same CSPRNG the EntropyGenerator already uses, so unlike the
    // touch samples it adds no entropy that is independent of the platform randomness.
    const userEntropy = entropyPool ?? generateUuid()

    return `${userEntropy}-${performance.now()}`
  }, [])

  return { getExtraEntropy }
}

export default useExtraEntropy
