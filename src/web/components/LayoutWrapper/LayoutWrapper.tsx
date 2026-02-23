import React, { FC, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { SPACING_2XL } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@web/utils/uiType'

type Props = {
  children: React.ReactNode
  backgroundStyle?: ViewStyle
  style?: ViewStyle
}

const { isPopup, isRequestWindow } = getUiType()

const LayoutWrapper: FC<Props> = ({ children, backgroundStyle = {}, style = {} }) => {
  const { theme } = useTheme()
  const { minHeightSize } = useWindowSize()

  const paddingTop = useMemo(() => {
    if (isRequestWindow) return SPACING_2XL
    if (isPopup) return 0

    if (minHeightSize(700)) return 24

    if (minHeightSize(800)) return 48

    if (minHeightSize(900)) return 96

    return 124
  }, [minHeightSize])

  return (
    <View
      style={[
        flexbox.flex1,
        flexbox.alignCenter,
        { paddingTop: paddingTop },
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
          borderRadius: isPopup ? 0 : BORDER_RADIUS_PRIMARY,
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
