import React, { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

import useTheme from '@common/hooks/useTheme'

function ProgressBar({ percentageDone }: { percentageDone: number }) {
  const { theme } = useTheme()
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percentageDone,
      duration: 300,
      useNativeDriver: false
    }).start()
  }, [percentageDone, progress])

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  })

  return (
    <View
      style={{ width: '100%', height: 2, backgroundColor: theme.neutral100, overflow: 'hidden' }}
    >
      <Animated.View
        style={{
          width,
          height: '100%',
          backgroundColor: theme.success400
        }}
      />
    </View>
  )
}

export default React.memo(ProgressBar)
