import React, { FC } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { LayoutWrapperProps } from './types'

const LayoutWrapper: FC<LayoutWrapperProps> = ({ children, backgroundStyle = {}, style = {} }) => {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        flexbox.flex1,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom + SPACING_SM
        },
        backgroundStyle
      ]}
    >
      {children}
    </View>
  )
}

export default LayoutWrapper
