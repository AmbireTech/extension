import React, { FC, useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import { isMobile } from '@common/config/env/env'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

const AnimatedDownArrow: FC<{
  isVisible: boolean
  appearance?: 'secondary' | 'primary'
  // When provided, the arrow becomes pressable (e.g. to scroll the related content down)
  onPress?: () => void
}> = ({ isVisible, appearance = 'secondary', onPress }) => {
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

  const iconContainerStyle = [
    styles.iconContainer,
    appearance === 'primary' ? styles.primary : styles.secondary
  ]

  return (
    <Animated.View
      // Let touches pass through the wrapper so only the icon itself is interactive
      pointerEvents="box-none"
      style={[
        styles.container,
        isMobile ? { transform: [{ translateY: bottom }], bottom: 10 } : { bottom }
      ]}
    >
      {onPress ? (
        <HoverablePressable onPress={onPress}>
          <View style={iconContainerStyle}>
            <DownArrowIcon />
          </View>
        </HoverablePressable>
      ) : (
        <View style={iconContainerStyle}>
          <DownArrowIcon />
        </View>
      )}
    </Animated.View>
  )
}

export default AnimatedDownArrow
