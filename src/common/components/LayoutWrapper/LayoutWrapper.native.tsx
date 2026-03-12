import React, { FC, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { SPACING, SPACING_2XL, SPACING_4XL, SPACING_LG, SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import { LayoutWrapperProps } from './types'

const { isPopup } = getUiType()

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
