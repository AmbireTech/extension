import { StyleSheet, ViewStyle } from 'react-native'

import { DEFAULT_SELECT_SIZE, SELECT_SIZE_TO_HEIGHT } from '@common/components/Select/styles'
import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  selectedFee: ViewStyle
  gasTankContainer: ViewStyle
  estimationContainer: ViewStyle
  estimationScrollView: ViewStyle
  spinner: ViewStyle
  nativeBridgeFeeContainer: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    selectedFee: {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: theme.primary
    },
    gasTankContainer: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween
    },
    estimationContainer: {
      ...flexbox.flex1,
      ...spacings.pbLg
    },
    estimationScrollView: {
      height: '100%'
    },
    spinner: {
      alignSelf: 'center'
    },
    nativeBridgeFeeContainer: {
      ...common.borderRadiusPrimary,
      ...common.hidden,
      ...flexbox.alignCenter,
      ...flexbox.directionRow,
      ...spacings.ph,
      width: '100%',
      height: SELECT_SIZE_TO_HEIGHT[DEFAULT_SELECT_SIZE],
      backgroundColor:
        themeType === THEME_TYPES.DARK ? theme.primaryBackground : theme.secondaryBackground,
      borderWidth: themeType === THEME_TYPES.DARK ? 0 : 1,
      borderColor: theme.secondaryBorder
    }
  })

export default getStyles
