import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import spacings, { SPACING_MI } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

export interface Style {
  inputContainer: ViewStyle
  borderWrapper: ViewStyle
  inputWrapper: ViewStyle
  input: TextStyle
  nativeInput: ViewStyle
  button: ViewStyle
  buttonWithBackground: ViewStyle
  bottomLabel: TextStyle
  label: TextStyle
  leftIcon: ViewStyle
  disabled: ViewStyle
  tooltipWrapper: ViewStyle
  tooltip: ViewStyle
  errorContainer: ViewStyle
}

const INPUT_HEIGHT = 48
export const INPUT_WRAPPER_HEIGHT = INPUT_HEIGHT + 2 // 1px border top and bottom

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    inputContainer: {
      ...spacings.mbSm,
      zIndex: 10
    },
    borderWrapper: {
      borderWidth: 2,
      borderRadius: 8,
      borderColor: 'transparent',
      ...common.hidden
    },
    inputWrapper: {
      ...flexbox.directionRow,
      borderWidth: 1,
      height: INPUT_WRAPPER_HEIGHT,
      ...common.borderRadiusPrimary
    },
    input: {
      // Centers the content (used because of the borderBottomWidth)
      fontSize: 14,
      ...flexbox.flex1,
      height: INPUT_HEIGHT,
      borderWidth: 0,
      ...spacings.ph
    },
    nativeInput: {
      height: '100%',
      fontFamily: isWeb ? FONT_FAMILIES.REGULAR : FONT_FAMILIES.LIGHT,
      color: theme.secondaryText,
      fontSize: 14
    },
    bottomLabel: {
      ...spacings.phMi,
      ...spacings.mbMI,
      ...spacings.phTy,
      paddingTop: SPACING_MI / 2
    },
    label: {
      ...spacings.mbMi
    },
    button: {
      ...flexbox.justifyCenter,
      ...spacings.mlTy,
      ...spacings.mrTy,
      ...spacings.mvTy,
      ...spacings.pvMi,
      ...spacings.phSm,
      ...common.borderRadiusPrimary
    },
    buttonWithBackground: {
      backgroundColor: theme.tertiaryBackground
    },
    leftIcon: {
      ...flexbox.justifyCenter,
      ...spacings.plTy
    },
    disabled: {
      opacity: 0.6
    },
    tooltipWrapper: {
      position: 'absolute',
      left: '100%',
      zIndex: 10
      // width: 350
    },
    tooltip: {
      ...spacings.mlTy,
      backgroundColor: theme.primaryBackground,
      ...spacings.phLg,
      ...spacings.pv,
      borderRadius: 6,
      borderColor: theme.secondaryBorder,
      borderWidth: 2
    },
    errorContainer: {
      marginTop: 8,
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween
    }
  })

export default getStyles
