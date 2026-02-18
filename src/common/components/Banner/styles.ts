import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...spacings.phSm,
      ...spacings.ptTy,
      ...spacings.pbTy,
      ...spacings.mbTy,
      ...commonStyles.borderRadiusPrimary
    }
  })

export default getStyles
