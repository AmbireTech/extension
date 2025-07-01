import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'

interface Styles {
  shadowPrimary: ViewStyle
  shadowSecondary: ViewStyle
  shadowTertiary: ViewStyle
  shadowTertiaryDarkMode: ViewStyle
  borderRadiusPrimary: ViewStyle
  borderRadiusSecondary: ViewStyle
  borderRadiusTertiary: ViewStyle
  hidden: ViewStyle
  fullWidth: ViewStyle
  visibilityHidden: ViewStyle
}

export const BORDER_RADIUS_PRIMARY = 6
export const BORDER_RADIUS_SECONDARY = 12
export const BORDER_RADIUS_TERTIARY = 2

const commonStyles: Styles = {
  shadowPrimary: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: {
      width: 0,
      height: 5
    },
    shadowRadius: 10,
    elevation: 9
  },
  shadowSecondary: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7
  },
  shadowTertiary: {
    shadowColor: '#767DAD4D',
    shadowOffset: {
      width: 0,
      height: 12
    },
    shadowRadius: 24,
    elevation: 7
  },
  shadowTertiaryDarkMode: {
    shadowColor: '#00000052',
    shadowOffset: {
      width: 0,
      height: 12
    },
    shadowRadius: 24,
    elevation: 7
  },
  borderRadiusPrimary: {
    borderRadius: BORDER_RADIUS_PRIMARY
  },
  borderRadiusSecondary: {
    borderRadius: BORDER_RADIUS_SECONDARY
  },
  borderRadiusTertiary: {
    borderRadius: BORDER_RADIUS_TERTIARY
  },
  hidden: {
    overflow: 'hidden'
  },
  fullWidth: {
    width: '100%'
  },
  visibilityHidden: {
    opacity: 0
  }
}

// Spreading `StyleSheet.create` styles into another `style` object is not
// supported by react-native-web (styles are missing in the final object)
// {@link https://github.com/necolas/react-native-web/issues/1377}
export default isWeb ? commonStyles : StyleSheet.create<Styles>(commonStyles)
