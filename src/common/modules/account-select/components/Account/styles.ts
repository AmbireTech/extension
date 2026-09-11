import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  accountContainer: ViewStyle
}

// Every screen stacks name / address / balance+badges on three rows, which need this height.
// Web fits them in less, as it has no vertical padding and its text does not scale up
export const ACCOUNT_SELECT_ACCOUNT_HEIGHT = isWeb ? 82 : 88
export const ACCOUNT_SELECT_ACCOUNT_MB = SPACING_TY

const getStyles = () =>
  StyleSheet.create<Style>({
    accountContainer: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...spacings.phTy,
      // The fixed height already leaves the three rows enough room on web
      ...(isWeb ? spacings.pv0 : spacings.pvTy),
      ...common.borderRadiusPrimary,
      marginBottom: ACCOUNT_SELECT_ACCOUNT_MB,
      minHeight: ACCOUNT_SELECT_ACCOUNT_HEIGHT,
      maxHeight: ACCOUNT_SELECT_ACCOUNT_HEIGHT
    }
  })

export default getStyles
