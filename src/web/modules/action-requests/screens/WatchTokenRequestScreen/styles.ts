import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_SM } from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  container: ViewStyle
  content: ViewStyle
  contentHeader: ViewStyle
  contentBody: ViewStyle
  tokenInfoContainer: ViewStyle
  tokenInfoIconWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Styles>({
    container: {
      ...flexbox.alignCenter,
      marginHorizontal: 'auto',
      ...flexbox.flex1,
      maxWidth: 422
    },
    content: {
      ...common.fullWidth,
      borderRadius: BORDER_RADIUS_PRIMARY,
      overflow: 'hidden',
      backgroundColor: theme.secondaryBackground
    },
    contentHeader: {
      ...flexbox.flex1,
      ...flexbox.alignCenter,
      ...spacings.pvMd,
      ...spacings.phMd
    },
    contentBody: {
      backgroundColor: theme.tertiaryBackground,
      ...spacings.pvMd,
      ...spacings.phMd
    },
    tokenInfoContainer: {
      backgroundColor: theme.tertiaryBackground,
      height: 36,
      ...spacings.phTy,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      borderRadius: BORDER_RADIUS_PRIMARY,
      ...flexbox.justifySpaceBetween
    },
    tokenInfoIconWrapper: {
      width: 32,
      height: 32,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.mrMi
    }
  })

export default getStyles
