import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'

interface Style {
  logo: ImageStyle
  svgLogoWrapper: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    logo: {
      width: 25,
      height: 25,
      borderRadius: 5,
      ...(spacings.mrMi as ImageStyle) // TODO: spacings has type mismatch with ImageStyle
    },
    svgLogoWrapper: {
      borderRadius: 5,
      width: 25,
      height: 25,
      overflow: 'hidden',
      ...spacings.mrMi,
      backgroundColor: 'red'
    }
  })

export default getStyles
