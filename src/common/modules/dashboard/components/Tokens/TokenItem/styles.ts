import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  legacyBadge: ViewStyle
  legacyBadgeDot: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      display: 'flex',
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      paddingVertical: 6,
      ...spacings.phTy,
      ...(isMobile ? spacings.mvMi : {})
    },
    legacyBadge: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mlTy,
      ...spacings.phTy,
      height: 16,
      borderRadius: 10,
      backgroundColor: theme.warningBackground,
      // Same color as the background at rest, so the hover outline can appear without the
      // border changing the badge's size
      borderWidth: 1,
      borderColor: theme.warningBackground,
      // Ignored on native; on web it marks the badge as clickable - it opens the
      // xWALLET migration request
      cursor: 'pointer'
    },
    legacyBadgeDot: {
      ...spacings.mrMi,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.errorText
    }
  })

export default getStyles
