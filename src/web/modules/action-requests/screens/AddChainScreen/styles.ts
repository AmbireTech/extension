import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  dappInfoContainer: ViewStyle
  dappInfoContent: ViewStyle
  separator: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    dappInfoContainer: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mbMd
    },
    dappInfoContent: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.phMd,
      ...flexbox.flex1
    },
    separator: {
      width: 1,
      maxWidth: 1,
      flex: 1,
      marginHorizontal: 10
    }
  })

export default getStyles
