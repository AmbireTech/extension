import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_TY } from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  backgroundLogo: ViewStyle
  button: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      position: 'relative',
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter,

      marginBottom: SPACING_TY,
      ...commonStyles.borderRadiusPrimary,
      overflow: 'hidden',
      minHeight: 56,
      borderWidth: 1,
      borderColor: 'transparent'
    },
    backgroundLogo: {
      position: 'absolute',
      right: 0,
      bottom: '-188px'
    },
    button: {
      backgroundColor: 'black'
    }
  })

export default getStyles
