import React, { FC } from 'react'
import { View } from 'react-native'

import GlassView from '@common/components/GlassView'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const FooterGlassView: FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        bottom: SPACING_SM,
        width: '100%',
        ...flexbox.center,
        zIndex: 3
      }}
    >
      <GlassView
        style={{
          borderRadius: 32
        }}
        cssStyle={{ borderRadius: 32 }}
      >
        <View style={[spacings.ph, spacings.pv]}>{children}</View>
      </GlassView>
    </View>
  )
}

export default FooterGlassView
