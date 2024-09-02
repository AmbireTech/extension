import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  image: ImageStyle
  fallbackIcon: ImageStyle
  kindOfMessage: ViewStyle
  kindOfMessageText: TextStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: { ...flexbox.alignStart, width: '100%' },
    image: { width: 48, height: 48, ...spacings.mrSm, alignSelf: 'flex-start' },
    fallbackIcon: {
      width: 48,
      height: 48,
      ...spacings.mrSm,
      backgroundColor: theme.secondaryBackground,
      alignSelf: 'flex-start',
      borderRadius: 4,
      ...spacings.pvMi,
      ...spacings.phMi
    },
    kindOfMessage: {
      backgroundColor: theme.infoBackground,
      borderColor: theme.infoDecorative,
      borderWidth: 1,
      borderRadius: 24,
      width: 'auto',
      height: 24,
      ...flexbox.justifyCenter,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.pl,
      ...spacings.prMi
    },
    kindOfMessageText: spacings.mr
  })

export default getStyles
