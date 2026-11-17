import React, { ReactNode, useCallback } from 'react'
import { LayoutChangeEvent, View } from 'react-native'

import { isWeb } from '@common/config/env'
import { SPACING, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

export interface OverviewCollapsibleProps {
  /**
   * The overview is never resized: the pages slide over the collapsible part instead, as
   * resizing it would redraw the filtered background every frame.
   */
  onHeightChange?: (height: number) => void
  children: ReactNode
}

// How far the content is spaced from the header above it and from the bottom of the card
const CONTENT_SPACING = isWeb ? SPACING : SPACING_SM

// The card pads its bottom by SPACING_TY to match its top once collapsed, the rest of the
// spacing it has when open is covered together with the content
const CONTENT_PADDING = {
  paddingTop: CONTENT_SPACING,
  paddingBottom: CONTENT_SPACING - SPACING_TY
}

const OverviewCollapsible = ({ onHeightChange, children }: OverviewCollapsibleProps) => {
  const onLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => onHeightChange?.(nativeEvent.layout.height),
    [onHeightChange]
  )

  return (
    <View style={[flexbox.alignCenter, CONTENT_PADDING]} onLayout={onLayout}>
      {children}
    </View>
  )
}

export default React.memo(OverviewCollapsible)
