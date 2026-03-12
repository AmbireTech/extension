import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  accountContainer: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    accountContainer: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...spacings.phTy,
      ...spacings.pvTy,
      ...spacings.mbTy,
      ...(isWeb ? spacings.prSm : {}),
      ...common.borderRadiusPrimary
    }
  })

export default getStyles
