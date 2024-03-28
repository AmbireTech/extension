import './backdrop-style.css'

import { BlurView } from 'expo-blur'
import React, { useEffect } from 'react'
import { Animated, Easing, StyleSheet, TouchableOpacity } from 'react-native'

import { isiOS, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import flexboxStyles from '@common/styles/utils/flexbox'

import getStyles from './styles'

interface Props {
  isBottomSheetVisible: boolean
  isVisible: boolean
  onPress: () => void
}

const ANIMATION_DURATION: number = 250

const Backdrop = ({ isBottomSheetVisible, isVisible, onPress }: Props) => {
  const { styles } = useTheme(getStyles)

  const opacity = React.useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      easing: Easing.linear,
      useNativeDriver: !isWeb
    }).start()
  }, [])

  useEffect(() => {
    if (!isBottomSheetVisible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        easing: Easing.linear,
        useNativeDriver: !isWeb
      }).start()
    }
  }, [isBottomSheetVisible, opacity])

  return (
    <Animated.View
      style={[
        styles.backDrop,
        {
          opacity: opacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1]
          })
        }
      ]}
      nativeID="modalBackdrop"
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <TouchableOpacity style={flexboxStyles.flex1} activeOpacity={1} onPress={onPress}>
        {isiOS ? (
          // The blurred view works on iOS only
          <BlurView
            intensity={55}
            tint="dark"
            style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: 0.98
              }
            ]}
          />
        ) : (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: 'rgba(45, 49, 77, 0.6)'
              }
            ]}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

export default React.memo(Backdrop)
