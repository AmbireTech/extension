import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  hero: ViewStyle
  heroContent: ViewStyle
  heroBackground: ImageStyle
  fullWidthText: TextStyle
  dotsContainer: ViewStyle
  dot: ViewStyle
  dotActive: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    // Same banner background as the keystore unlock screen
    hero: {
      height: 240,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      borderRadius: BORDER_RADIUS_PRIMARY,
      overflow: 'hidden'
    },
    heroContent: {
      width: '100%',
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.phLg
    },
    heroBackground: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      objectFit: 'fill',
      top: 0,
      left: 0,
      zIndex: -1
    },
    fullWidthText: {
      width: '100%'
    },
    dotsContainer: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.tertiaryText,
      ...spacings.mhTy
    },
    dotActive: {
      width: 24,
      backgroundColor: theme.secondaryText
    }
  })

export default getStyles
