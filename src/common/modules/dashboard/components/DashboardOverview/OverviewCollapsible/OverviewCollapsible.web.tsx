import React from 'react'
import { Animated } from 'react-native'

import { SPACING, SPACING_XL } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { OverviewCollapsibleProps } from './OverviewCollapsible'

const OverviewCollapsible = ({ animatedOverviewHeight, children }: OverviewCollapsibleProps) => (
  <Animated.View
    style={{
      ...flexbox.alignCenter,
      paddingTop: animatedOverviewHeight.interpolate({
        inputRange: [0, SPACING_XL],
        outputRange: [0, SPACING],
        extrapolate: 'clamp'
      }),
      maxHeight: animatedOverviewHeight,
      overflow: 'hidden'
    }}
  >
    {children}
  </Animated.View>
)

export default React.memo(OverviewCollapsible)
