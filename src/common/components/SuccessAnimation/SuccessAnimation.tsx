import React, { useEffect, useRef } from 'react'
import { Animated, View, ViewStyle } from 'react-native'

import SuccessIcon from '@common/assets/svg/SuccessIcon'
import Spinner from '@common/components/Spinner'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const SuccessAnimation = ({
  style = {},
  size = 72,
  isLoading
}: {
  style?: ViewStyle
  size?: number
  isLoading?: boolean
}) => {
  const { theme } = useTheme()
  const scaleAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: !isWeb,
      tension: 50,
      friction: 7
    }).start()
  }, [scaleAnim])

  return (
    <View
      style={{
        ...flexbox.center,
        ...spacings.mbSm,
        width: size,
        height: size,
        ...style
      }}
    >
      <Animated.View
        style={{
          ...flexbox.center,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isLoading ? 'transparent' : theme.successBackground,
          transform: [{ scale: scaleAnim }]
        }}
      >
        {isLoading ? (
          <Spinner style={{ width: 20, height: 20 }} />
        ) : (
          <SuccessIcon width={size * 0.66} height={size * 0.66} color={theme.success400} />
        )}
      </Animated.View>
    </View>
  )
}
export default React.memo(SuccessAnimation)
