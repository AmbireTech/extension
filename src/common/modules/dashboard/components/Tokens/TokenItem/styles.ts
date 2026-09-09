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
      backgroundColor: theme.warningBackground
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
