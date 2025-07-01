import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_TY } from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  content: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      marginBottom: SPACING_TY,
      ...commonStyles.borderRadiusPrimary,
      overflow: 'hidden',
      minHeight: 56
    },
    content: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.flex1,
      ...spacings.plSm,
      borderLeftWidth: 6,
      ...spacings.pvTy,
      minHeight: 56
    }
  })

export default getStyles
