import React from 'react'
import { Animated, Pressable, PressableProps, View } from 'react-native'

import { SwitchIconLeft, SwitchIconRight } from '@common/assets/svg/SwitchIcon'
import useTheme from '@common/hooks/useTheme'
import { useCustomHover } from '@web/hooks/useHover'

import getStyles from './styles'

const SWITCH_TOKENS_CONDITION_TOOLTIP_ID = 'switch-tokens-condition-tooltip-sab'

const SwitchTokensButton = ({ disabled, ...rest }: PressableProps) => {
  const { styles } = useTheme(getStyles)
  const [bindAnim, , , , animatedValues] = useCustomHover({
    property: 'translateY',
    values: { from: 0, to: 1 },
    duration: 150
  })

  const topPathInterpolate = animatedValues
    ? animatedValues[0].value.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -6]
      })
    : 0

  const bottomPathInterpolate = animatedValues
    ? animatedValues[0].value.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 6]
      })
    : 0

  return (
    <View style={styles.switchTokensButtonWrapper} testID={SWITCH_TOKENS_CONDITION_TOOLTIP_ID}>
      <Pressable
        style={[styles.switchTokensButton, disabled ? { opacity: 0.5 } : {}]}
        disabled={disabled}
        {...bindAnim}
        {...rest}
      >
        <View style={{ position: 'relative', width: 20, height: 20 }}>
          {/* Left arrow - moves up */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: [{ translateY: topPathInterpolate }]
            }}
          >
            <SwitchIconLeft />
          </Animated.View>

          {/* Right arrow - moves down */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: [{ translateY: bottomPathInterpolate }]
            }}
          >
            <SwitchIconRight />
          </Animated.View>
        </View>
      </Pressable>
    </View>
  )
}

export default React.memo(SwitchTokensButton)
