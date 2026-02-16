import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { SPACING_2XL } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@web/utils/uiType'

type Props = {
  children: React.ReactNode
  backgroundStyle?: ViewStyle
  style?: ViewStyle
}

const { isTab, isRequestWindow } = getUiType()

const LayoutWrapper: FC<Props> = ({ children, backgroundStyle = {}, style = {} }) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        flexbox.flex1,
        flexbox.alignCenter,
        isTab && { paddingTop: 124 },
        isRequestWindow && { paddingTop: SPACING_2XL },
        { backgroundColor: theme.secondaryBackground },
        backgroundStyle
      ]}
    >
      <View
        style={{
          maxWidth: 600,
          width: '100%',
          height: 600,
          backgroundColor: theme.primaryBackground,
          borderRadius: BORDER_RADIUS_PRIMARY,
          overflow: 'hidden',
          shadowColor: theme.neutral400,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 1,
          shadowRadius: 24,
          elevation: 12,
          ...style
        }}
      >
        {children}
      </View>
    </View>
  )
}

export default LayoutWrapper
