import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { TAB_CONTENT_WIDTH } from '@web/constants/spacings'

interface Style {
  background: ViewStyle
  container: ViewStyle
  contentContainer: ViewStyle
  header: ViewStyle
  panel: ViewStyle
  sideContainer: ViewStyle
}

export const SETTINGS_HEADER_HEIGHT = 64

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    background: {
      ...flexbox.alignCenter,
      ...flexbox.flex1,
      backgroundColor: theme.primaryBackground
    },
    container: {
      ...flexbox.directionRow,
      ...flexbox.flex1
    },
    contentContainer: {
      ...spacings.mhLg,
      ...spacings.ptXl,
      ...flexbox.flex1
    },
    header: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyEnd,
      height: SETTINGS_HEADER_HEIGHT
    },
    panel: {
      ...spacings.mbLg,
      ...flexbox.flex1,
      width: 800,
      maxHeight: '100%'
      // backgroundColor: theme.secondaryBackground
    },
    sideContainer: {
      opacity: 0,
      // @ts-ignore
      pointerEvents: 'none'
    }
  })

export default getStyles
