import React from 'react'
import { Control } from 'react-hook-form'
import { View } from 'react-native'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import GlassView from '@common/components/GlassView'
import { isMobile, isWeb } from '@common/config/env'
import spacings, { SPACING } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import CurrentApp from './CurrentApp'
import DashboardSearch from './DashboardSearch'

type Props = {
  control: Control<{ search: string }, any>
  displayCurrentApp?: boolean
  isHidden: boolean
}

const SearchAndCurrentApp = ({ control, displayCurrentApp = false, isHidden }: Props) => {
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
    const keyboardOffset = isMobile ? Math.abs(height.value) : 0
    return {
      bottom: animatedBottom.value + keyboardOffset
    }
  }, [isMobile, height])

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          zIndex: 3,
          ...flexbox.center
        },
        isWeb && {
          left: 0,
          width: '100%',
          pointerEvents: 'none'
        },
        isMobile && {
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

export default SearchAndCurrentApp
