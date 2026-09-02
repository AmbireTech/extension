import React, { FC, useMemo } from 'react'
import { View } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { SPACING, SPACING_2XL, SPACING_MD } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import { LayoutWrapperProps } from './types'

const { isPopup, isSidePanel, isRequestWindow } = getUiType()

// The popup and the side panel are overlay surfaces that should fill their window
// instead of rendering a centered, fixed-height card like the tab layout does.
const fillsWindow = isPopup || isSidePanel

const LayoutWrapper: FC<LayoutWrapperProps> = ({ children, backgroundStyle = {}, style = {} }) => {
  const { theme } = useTheme()
  const { minHeightSize } = useWindowSize()

  const paddingTop = useMemo(() => {
    if (isRequestWindow) {
      if (minHeightSize(800)) return SPACING

      return SPACING_2XL
    }
    if (fillsWindow) return 0

    // The offset a tab gets through `TabLayoutWrapperMainContent`, so every card of a tab
    // starts at one height: the margin of its content container (dropped on short windows)
    // plus the padding it gives the onboarding panels
    const contentMarginTop = minHeightSize('m') ? 0 : SPACING_MD

    return contentMarginTop + (minHeightSize('xl') ? SPACING : SPACING_2XL)
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
          maxWidth: fillsWindow ? '100%' : 600,
          width: '100%',
          height: fillsWindow ? '100%' : 600,
          backgroundColor: theme.primaryBackground,
          borderRadius: fillsWindow ? 0 : BORDER_RADIUS_PRIMARY,
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
