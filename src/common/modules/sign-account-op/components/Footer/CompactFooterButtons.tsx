import React, { ReactNode } from 'react'
import { View } from 'react-native'

import useFooterRowSplit from '@common/modules/sign-account-op/hooks/useFooterRowSplit'
import { SPACING_MI, SPACING_TY, SPACING_XL } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

/** Space between the fee token select and the compact row of buttons under them */
export const COMPACT_FEE_TO_BUTTONS_SPACING = SPACING_XL - SPACING_MI

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
  const { leftFlex, rightFlex } = useFooterRowSplit(isEvenSplit)

  return (
    <View style={[flexbox.directionRow, { gap: SPACING_TY }]}>
      <View style={[flexbox.directionRow, { flex: leftFlex, gap: SPACING_TY }]}>
        {secondaryActions}
      </View>
      <View style={{ flex: rightFlex, minWidth: 0 }}>{primaryAction}</View>
    </View>
  )
}

export default React.memo(CompactFooterButtons)
