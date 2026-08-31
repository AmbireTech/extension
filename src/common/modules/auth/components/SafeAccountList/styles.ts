import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  deployedOnContainer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    deployedOnContainer: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.phSm,
      ...spacings.pbSm,
      width: '100%',
      backgroundColor: theme.secondaryBackground
    }
  })

export default getStyles
