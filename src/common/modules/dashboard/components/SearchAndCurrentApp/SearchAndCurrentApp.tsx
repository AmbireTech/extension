import React, { useEffect, useMemo } from 'react'
import { Control } from 'react-hook-form'
import { Animated, View } from 'react-native'

import GlassView from '@common/components/GlassView'
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

  useEffect(() => {
    Animated.spring(animatedBottom, {
      toValue: isHidden ? -60 : SPACING,
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
        pointerEvents: 'none'
      }}
    >
      <GlassView
        style={{
          borderRadius: 28
        }}
        cssStyle={{
          borderRadius: 28,
          pointerEvents: 'all'
        }}
      >
        <View style={[spacings.phTy, spacings.pvTy, flexbox.directionRow, flexbox.alignCenter]}>
          <DashboardSearch control={control} />
          {displayCurrentApp && <CurrentApp />}
        </View>
      </GlassView>
    </Animated.View>
  )
}

export default SearchAndCurrentApp
