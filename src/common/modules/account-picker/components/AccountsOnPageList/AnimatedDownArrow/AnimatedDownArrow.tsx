import React, { FC, useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

const AnimatedDownArrow: FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const bottom = useRef(new Animated.Value(0)).current
  const { styles } = useTheme(getStyles)

  useEffect(() => {
    if (!isVisible) return

    Animated.loop(
      Animated.sequence([
        Animated.timing(bottom, {
          toValue: 10,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(bottom, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        })
      ])
    ).start()
  }, [bottom, isVisible])

  if (!isVisible) return null

  return (
    <Animated.View style={[styles.container, { bottom }]}>
      <View style={styles.iconContainer}>
        <DownArrowIcon />
      </View>
    </Animated.View>
  )
}

export default AnimatedDownArrow
