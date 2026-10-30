import React, { useEffect, useMemo, useState } from 'react'
import { Animated, StyleProp, View, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'

type Props = {
  /** How much of the animated QR code is read, from 0 to 1 */
  progress: number
  style?: StyleProp<ViewStyle>
}

const BAR_HEIGHT = 4

/**
 * Fills up as the parts of an animated QR code come in, so the user can tell that the scan
 * is going and how much of it is left.
 */
const QrScanProgressBar = ({ progress, style }: Props) => {
  const { theme } = useTheme()
  const [fill] = useState(() => new Animated.Value(progress))

  useEffect(() => {
    const animation = Animated.timing(fill, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false
    })
    animation.start()

    return () => animation.stop()
  }, [fill, progress])

  const width = useMemo(
    () => fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
    [fill]
  )

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      style={[
        {
          height: BAR_HEIGHT,
          borderRadius: BAR_HEIGHT / 2,
          overflow: 'hidden',
          backgroundColor: theme.backdrop
        },
        style
      ]}
    >
      <Animated.View style={{ width, height: '100%', backgroundColor: theme.primaryAccent }} />
    </View>
  )
}

export default React.memo(QrScanProgressBar)
