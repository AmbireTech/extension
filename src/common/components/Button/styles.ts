import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { FONT_FAMILIES } from '@common/hooks/useFonts'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import textStyles from '@common/styles/utils/text'

interface Style {
  buttonContainer: ViewStyle

  buttonContainerPrimary: ViewStyle
  buttonContainerSecondary: ViewStyle
  buttonContainerDanger: ViewStyle
  buttonContainerOutline: ViewStyle
  buttonContainerGhost: ViewStyle

  buttonContainerStylesSizeRegular: ViewStyle
  buttonContainerStylesSizeSmall: ViewStyle

  buttonText: TextStyle

  buttonTextPrimary: TextStyle
  buttonTextSecondary: TextStyle
  buttonTextDanger: TextStyle
  buttonTextOutline: TextStyle
  buttonTextGhost: TextStyle

  buttonTextStylesSizeRegular: TextStyle
  buttonTextStylesSizeSmall: TextStyle

  disabled: ViewStyle
}

const styles = StyleSheet.create<Style>({
  // Default button container styles
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 13,
    borderColor: 'transparent'
  },

  // Button container styles by type
  buttonContainerPrimary: {
    backgroundColor: 'transparent',
    borderWidth: 0
  },
  buttonContainerSecondary: {
    backgroundColor: colors.howl
  },
  buttonContainerDanger: {
    borderColor: colors.pink
  },
  buttonContainerOutline: {
    borderColor: colors.turquoise
  },
  buttonContainerGhost: {
    backgroundColor: 'transparent',
    minHeight: 'auto',
    ...spacings.pv0
  },

  // Button sizes (regular/small)
  buttonContainerStylesSizeRegular: {
    minHeight: 56,
    ...spacings.pvMi,
    ...spacings.phSm,
    ...spacings.mb
  },
  buttonContainerStylesSizeSmall: {
    minHeight: 40,
    ...spacings.pvMi,
    ...spacings.phTy,
    ...spacings.mbTy
  },

  // Default button text styles
  buttonText: {
    fontFamily: FONT_FAMILIES.REGULAR,
    textAlign: 'center',
    lineHeight: 22
  },

  // Button text styles by type
  buttonTextPrimary: {
    color: colors.titan
  },
  buttonTextSecondary: {
    color: colors.titan
  },
  buttonTextDanger: {
    color: colors.pink
  },
  buttonTextOutline: {
    color: colors.turquoise
  },
  buttonTextGhost: {
    color: colors.titan
  },

  // Button text sizes (regular/small)
  buttonTextStylesSizeRegular: {
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

export default styles
