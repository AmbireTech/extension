import React, { FC, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { SPACING, SPACING_2XL, SPACING_4XL, SPACING_LG } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

type Props = {
  children: React.ReactNode
  backgroundStyle?: ViewStyle
  style?: ViewStyle
}

const { isPopup, isRequestWindow } = getUiType()

const LayoutWrapper: FC<Props> = ({ children, backgroundStyle = {}, style = {} }) => {
  const { theme } = useTheme()
  const { minHeightSize } = useWindowSize()
  const insets = useSafeAreaInsets()

  const calculatedPaddingTop = useMemo(() => {
    if (isRequestWindow) {
      if (minHeightSize(800)) return SPACING

      return SPACING_2XL
    }
    if (isPopup) return 0

    if (minHeightSize(700)) return SPACING_LG

    if (minHeightSize(800)) return SPACING_2XL

    if (minHeightSize(900)) return SPACING_4XL

    return 124
  }, [minHeightSize])

  return (
    <View
      style={[
        flexbox.flex1,
        flexbox.alignCenter,
        {
          backgroundColor: theme.secondaryBackground,
          paddingTop: Math.max(insets.top, calculatedPaddingTop),
          paddingBottom: insets.bottom
        },
        backgroundStyle
      ]}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: theme.primaryBackground,
          borderRadius: isPopup ? 0 : BORDER_RADIUS_PRIMARY,
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
