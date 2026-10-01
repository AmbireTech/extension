import React, { useCallback } from 'react'
import { LayoutChangeEvent, View } from 'react-native'

import { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { OverviewCollapsibleProps } from './OverviewCollapsible'

// The card pads its bottom by SPACING_TY to match its top once collapsed, the rest of the
// SPACING_SM it has when open is covered together with the content
const CONTENT_PADDING = { paddingTop: SPACING_SM, paddingBottom: SPACING_SM - SPACING_TY }

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
