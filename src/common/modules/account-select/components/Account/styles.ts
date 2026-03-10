import { StyleSheet, ViewStyle } from 'react-native'

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
      ...spacings.pr,
      ...common.borderRadiusPrimary
    }
  })

export default getStyles
