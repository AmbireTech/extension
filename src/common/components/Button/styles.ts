import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import commonStyles from '@common/styles/utils/common'

interface Style {
  buttonContainer: ViewStyle

  buttonContainerPrimary: ViewStyle
  buttonContainerSecondary: ViewStyle
  buttonContainerDanger: ViewStyle
  buttonContainerOutline: ViewStyle
  buttonContainerGhost: ViewStyle

  buttonContainerStylesSizeLarge: ViewStyle
  buttonContainerStylesSizeRegular: ViewStyle
  buttonContainerStylesSizeSmall: ViewStyle

  buttonTextPrimary: TextStyle
  buttonTextSecondary: TextStyle
  buttonTextDanger: TextStyle
  buttonTextOutline: TextStyle
  buttonTextGhost: TextStyle

  buttonTextStylesSizeLarge: TextStyle
  buttonTextStylesSizeRegular: TextStyle
  buttonTextStylesSizeSmall: TextStyle

  disabled: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    // Default button container styles
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
      ...commonStyles.borderRadiusPrimary
    },

    // Button container styles by type
    buttonContainerPrimary: {
      borderWidth: 0
    },
    buttonContainerSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.primary
    },
    buttonContainerDanger: {
      borderColor: theme.errorDecorative,
      borderWidth: 1
    },
    buttonContainerOutline: {
      borderColor: theme.successDecorative
    },
    buttonContainerGhost: {
      backgroundColor: 'transparent',
      minHeight: 'auto',
      ...spacings.pv0
    },

    // Button sizes (large/regular/small)
    buttonContainerStylesSizeLarge: {
      height: 56,
      ...spacings.pvMi,
      ...spacings.phXl,
      ...spacings.mb
    },
    buttonContainerStylesSizeRegular: {
      height: 56,
      ...spacings.pvMi,
      ...spacings.phSm,
      ...spacings.mb
    },
    buttonContainerStylesSizeSmall: {
      height: 40,
      ...spacings.pvMi,
      ...spacings.phTy,
      ...spacings.mbTy
    },

    // Button text styles by type
    buttonTextPrimary: {
      color: '#fff'
    },
    buttonTextSecondary: {
      color: theme.primary
    },
    buttonTextDanger: {
      color: theme.errorDecorative
    },
    buttonTextOutline: {
      color: theme.successDecorative
    },
    buttonTextGhost: {
      color: theme.secondaryText
    },

    // Button text sizes (regular/small)
    buttonTextStylesSizeRegular: {
      fontSize: 16
    },
    buttonTextStylesSizeLarge: {
      fontSize: 16
    },
    buttonTextStylesSizeSmall: {
      fontSize: 14,
      // On iOS no visual difference, but on Android, it vertically centers better
      lineHeight: 19
    },

    // Default button disabled styles
    disabled: {
      opacity: 0.5
    }
  })

export default getStyles
