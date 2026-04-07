import { ImageStyle, StyleSheet } from 'react-native'

import spacings from '@common/styles/spacings'

interface Style {
  logo: ImageStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    logo: {
      width: 25,
      height: 25,
      borderRadius: 5,
      ...(spacings.mrMi as ImageStyle) // TODO: spacings has type mismatch with ImageStyle
    }
  })

export default getStyles
