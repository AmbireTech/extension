import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile, isWeb } from '@common/config/env'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  accountContainer: ViewStyle
}

// Mobile stacks name / address / balance+badges on three rows, so it needs more height
export const ACCOUNT_SELECT_ACCOUNT_HEIGHT = isMobile ? 88 : 57
export const ACCOUNT_SELECT_ACCOUNT_MB = SPACING_TY

const getStyles = () =>
  StyleSheet.create<Style>({
    accountContainer: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...spacings.phTy,
      ...spacings.pvTy,
      ...(isWeb ? spacings.prSm : {}),
      ...common.borderRadiusPrimary,
      marginBottom: ACCOUNT_SELECT_ACCOUNT_MB,
      minHeight: ACCOUNT_SELECT_ACCOUNT_HEIGHT,
      maxHeight: ACCOUNT_SELECT_ACCOUNT_HEIGHT
    }
  })

export default getStyles
