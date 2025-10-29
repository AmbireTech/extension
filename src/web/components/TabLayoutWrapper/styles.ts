import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_MD } from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@web/utils/uiType'

interface Style {
  contentContainer: ViewStyle
  informationCircle: ViewStyle
  footerContainer: ViewStyle
  footer: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    contentContainer: {
      height: '100%',
      ...spacings.pbMd,
      ...spacings.ph0,
      marginTop: getUiType().isPopup ? 0 : SPACING_MD,
      ...flexbox.flex1
    },
    informationCircle: {
      ...flexbox.alignSelfCenter,
      ...spacings.pbLg
    },
    footerContainer: {
      ...flexbox.flex1,
      maxHeight: 80,
      ...spacings.ph3Xl,
      backgroundColor:
        themeType === THEME_TYPES.DARK ? theme.tertiaryBackground : theme.primaryBackground,
      shadowColor: themeType === THEME_TYPES.DARK ? '#00000052' : '#B8BDE080',
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 4,
      elevation: 7
    },
    footer: {
      ...flexbox.flex1,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter,
      ...flexbox.directionRow,
      width: '100%',
      marginHorizontal: 'auto'
    }
  })

export default getStyles
