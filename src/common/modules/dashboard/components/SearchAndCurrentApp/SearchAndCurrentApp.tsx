import React, { useEffect, useMemo } from 'react'
import { Control } from 'react-hook-form'
import { Animated, View } from 'react-native'
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
  const animatedBottom = useMemo(() => new Animated.Value(SPACING), [])
  const { bottom } = useSafeAreaInsets()
  useEffect(() => {
    Animated.spring(animatedBottom, {
      toValue: isHidden ? -60 - bottom : SPACING + bottom,
      bounciness: 0,
      speed: 2.8,
      overshootClamping: true,
      useNativeDriver: false
    }).start()
  }, [animatedBottom, isHidden])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        bottom: animatedBottom,
        width: '100%',
        ...flexbox.center,
        zIndex: 3,
        // Allow clicking elements behind
        pointerEvents: isWeb ? 'none' : 'auto'
      }}
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
