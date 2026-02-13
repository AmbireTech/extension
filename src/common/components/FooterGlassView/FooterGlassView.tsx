import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import GlassView from '@common/components/GlassView'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const FooterGlassView: FC<{
  children: React.ReactNode
  style?: ViewStyle
  borderRadius?: number
  innerContainerStyle?: ViewStyle
}> = ({ children, style = {}, innerContainerStyle, borderRadius = 32 }) => {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        bottom: SPACING_SM,
        width: '100%',
        ...flexbox.center,
        zIndex: 3,
        ...style
      }}
    >
      <GlassView
        style={{
          borderRadius
        }}
        cssStyle={{ borderRadius }}
      >
        <View style={[spacings.ph, spacings.pv, innerContainerStyle]}>{children}</View>
      </GlassView>
    </View>
  )
}

export default FooterGlassView
