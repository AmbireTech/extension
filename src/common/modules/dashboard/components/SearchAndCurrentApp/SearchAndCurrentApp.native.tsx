import React from 'react'
import { View } from 'react-native'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import GlassView from '@common/components/GlassView'
import spacings, { SPACING } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import CurrentApp from './CurrentApp'
import DashboardSearch from './DashboardSearch'

import { SearchAndCurrentAppProps } from './SearchAndCurrentApp'

const SearchAndCurrentApp: React.FC<SearchAndCurrentAppProps> = ({
  control,
  displayCurrentApp = false,
  isHidden
}) => {
  const { bottom: safeBottom } = useSafeAreaInsets()
  const { height } = useReanimatedKeyboardAnimation()

  const animatedBottom = useDerivedValue(() => {
    const toValue = isHidden ? -60 - safeBottom : SPACING + safeBottom
    return withSpring(toValue, {
      damping: 20,
      stiffness: 90,
      overshootClamping: true
    })
  }, [isHidden, safeBottom])

  const animatedStyle = useAnimatedStyle(() => {
    const keyboardOffset = Math.abs(height.value)
    return {
      bottom: animatedBottom.value + keyboardOffset
    }
  }, [height])

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          zIndex: 3,
          ...flexbox.center,
          ...flexbox.alignSelfCenter
        },
        animatedStyle
      ]}
    >
      <GlassView borderRadius={28} cssStyle={{ pointerEvents: 'all' }} isSimpleBlur={false}>
        <View style={[spacings.phTy, spacings.pvTy, flexbox.directionRow, flexbox.alignCenter]}>
          <DashboardSearch control={control} />
          {displayCurrentApp && <CurrentApp />}
        </View>
      </GlassView>
    </Animated.View>
  )
}

export default React.memo(SearchAndCurrentApp)
