import React, { ReactNode } from 'react'
import { View } from 'react-native'

import useWindowSize from '@common/hooks/useWindowSize'
import { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

/** Up to this window width the secondary actions get 55% of the row, above it - half */
const NARROWEST_LAYOUT_MAX_WIDTH = 400

type Props = {
  /** Reject/Back and Batch. Each should grow (`flexGrow: 1`) to share the leftover space */
  secondaryActions: ReactNode
  primaryAction: ReactNode
  /** Always split the row in half, e.g. when there is a single secondary action */
  isEvenSplit?: boolean
}

/**
 * The single row of footer buttons in the compact layout (mobile and the narrow side panel).
 * On the narrowest screens the secondary actions get a bit more than half of the row, so two
 * of them still fit side by side with readable labels
 */
const CompactFooterButtons = ({ secondaryActions, primaryAction, isEvenSplit }: Props) => {
  const { maxWidthSize } = useWindowSize()
  const isNarrowestLayout = !isEvenSplit && !maxWidthSize(NARROWEST_LAYOUT_MAX_WIDTH + 1)

  return (
    <View style={[flexbox.directionRow, { gap: SPACING_TY }]}>
      <View style={[flexbox.directionRow, { flex: isNarrowestLayout ? 11 : 1, gap: SPACING_TY }]}>
        {secondaryActions}
      </View>
      <View style={{ flex: isNarrowestLayout ? 9 : 1, minWidth: 0 }}>{primaryAction}</View>
    </View>
  )
}

export default React.memo(CompactFooterButtons)
