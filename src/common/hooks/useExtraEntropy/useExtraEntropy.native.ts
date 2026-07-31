import { useCallback, useRef, useState } from 'react'
import { GestureResponderEvent } from 'react-native'

import { generateUuid } from '@ambire-common/utils/uuid'

const MAX_KEYSTROKE_SAMPLES = 5

const useExtraEntropy = () => {
  const [touchPos, setTouchPos] = useState<{ x: number; y: number; timestamp: number } | null>(null)
  const keystrokeTimestamps = useRef<number[]>([])

  const onTouch = useCallback((e: GestureResponderEvent) => {
    const { pageX, pageY, timestamp } = e.nativeEvent
    setTouchPos({ x: pageX, y: pageY, timestamp })
  }, [])

  // Call this from the onChangeText of the password/PIN input on screens that need extra
  // entropy, so the irregular timing between real keystrokes feeds into the pool as well.
  const notifyKeystroke = useCallback(() => {
    const samples = keystrokeTimestamps.current
    samples.push(performance.now())
    if (samples.length > MAX_KEYSTROKE_SAMPLES) samples.shift()
  }, [])

  const getExtraEntropy = useCallback(() => {
    const touchEntropy = touchPos ? `${touchPos.x}-${touchPos.y}-${touchPos.timestamp}` : null
    const keystrokeEntropy = keystrokeTimestamps.current.length
      ? keystrokeTimestamps.current.join('-')
      : null
    const uuid = generateUuid()
    const realEntropy = [touchEntropy, keystrokeEntropy].filter(Boolean).join('-')

    return `${realEntropy || uuid}-${performance.now()}`
  }, [touchPos])

  return {
    getExtraEntropy,
    // Spread onto the root View of screens that create secrets/seeds, so real touch
    // movement feeds the pool the same way mouse movement does on web.
    touchHandlers: { onTouchStart: onTouch, onTouchMove: onTouch },
    notifyKeystroke
  }
}

export default useExtraEntropy
