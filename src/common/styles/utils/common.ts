import { ColorValue, StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'

interface Styles {
  shadowPrimary: ViewStyle
  shadowSecondary: ViewStyle
  shadowTertiary: ViewStyle
  borderRadiusPrimary: ViewStyle
  borderRadiusSecondary: ViewStyle
  borderRadiusTertiary: ViewStyle
  hidden: ViewStyle
  fullWidth: ViewStyle
  visibilityHidden: ViewStyle
}

export const BORDER_RADIUS_PRIMARY = 16
export const BORDER_RADIUS_SECONDARY = 12
export const BORDER_RADIUS_TERTIARY = 2

const commonStyles: Styles & StyleSheet.NamedStyles<any> = {
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
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12
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

export function hexToRgba(hex: string | ColorValue, opacity = 1) {
  let formattedHex = String(hex)
  // Remove the hash if present
  formattedHex = formattedHex.replace(/^#/, '')

  // Handle shorthand hex (e.g., #fff)
  if (formattedHex.length === 3) {
    formattedHex = formattedHex
      .split('')
      .map((char) => char + char)
      .join('')
  }

  // Parse the hex values
  const r = parseInt(formattedHex.substring(0, 2), 16)
  const g = parseInt(formattedHex.substring(2, 4), 16)
  const b = parseInt(formattedHex.substring(4, 6), 16)

  // Clamp opacity between 0 and 1
  opacity = Math.max(0, Math.min(1, opacity))

  // Return rgba string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
