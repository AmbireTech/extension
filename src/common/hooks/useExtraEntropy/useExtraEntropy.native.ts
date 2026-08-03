import { concat, keccak256, toUtf8Bytes } from 'ethers'
import { useCallback } from 'react'
import { GestureResponderEvent } from 'react-native'

import { generateUuid } from '@ambire-common/utils/uuid'

// Every touch is folded into a running 256-bit hash rather than stored, so nothing is ever
// evicted the way a fixed-size buffer would evict its oldest sample. Those 256 bits are the
// pool's capacity, not its yield - what it holds grows only with input that is genuinely
// independent of what came before, not with the number of events. On a smooth drag the next
// coordinate is largely predictable from the previous ones, but the sub-pixel fraction the
// digitizer reports is sensor noise and does not follow from the shape of the gesture.
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

// ~4-8 bits per event, most of it in the sub-pixel fraction of the coordinates. The timestamp
// carries less here than the mouse timestamp does on web, because the digitizer samples on a fixed
// 60-120Hz clock and so jitters far less than a mouse polling on its own.
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

/**
 * Collects unpredictable user input - the position and timing of touches - into an entropy pool,
 * and hands it out as a string that `EntropyGenerator` hashes and XORs into the output of the
 * platform CSPRNG, before that output becomes a keystore main key, a seed phrase, a scrypt salt or
 * an AES IV.
 *
 * The hypothetical problem it solves: every secret the wallet generates traces back to that one
 * CSPRNG, so if it is ever predictable - weak seeding early at boot, a restored device image
 * reusing state, an OS bug - then every one of those secrets is guessable, and no amount of correct
 * crypto downstream helps. The pool is a second source that does not depend on the platform
 * randomness at all.
 *
 * It is defense in depth, not a replacement. The mixing is an XOR, which can never lower the
 * entropy of either input, so when the CSPRNG is healthy this costs nothing.
 *
 * Total is ~50 bits when no touch has been observed and the two clocks carry it alone, and the low
 * hundreds after a screen or two of ordinary use. It reaches the pool's 256-bit ceiling less
 * readily than on web: a tap is a handful of events where a mouse moving across a page is hundreds,
 * and there is no keystroke source to make up for it.
 */
const useExtraEntropy = () => {
  const getExtraEntropy = useCallback(() => {
    // The uuid is only a fallback for the (unlikely) case of not a single touch being registered
    // yet. It is drawn from the same CSPRNG the EntropyGenerator already uses, so unlike the
    // touch samples it adds no entropy that is independent of the platform randomness.
    const userEntropy = entropyPool ?? generateUuid()
    // ~20-30 bits from performance.now() (how long the app had been running, and unlike a browser
    // the runtime does not coarsen it) and ~26 from Date.now() against an attacker who knows the
    // day. Being an absolute wall clock, Date.now() survives one who can bound when the app was
    // launched, which bounds performance.now(). Both only really matter on the fallback path.
    const extraEntropy = `${userEntropy}-${performance.now()}-${Date.now()}`

    // Advance the pool so the value just handed out is not the state a later call would return -
    // one leaked extraEntropy string then cannot stand in for the pool for the rest of the session.
    foldIntoEntropyPool(extraEntropy)

    return extraEntropy
  }, [])

  return { getExtraEntropy }
}

export default useExtraEntropy
