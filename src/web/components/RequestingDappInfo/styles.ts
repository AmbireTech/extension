import { ImageStyle, StyleSheet } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

interface Style {
  image: ImageStyle
  fallbackIcon: ImageStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    image: {
      alignSelf: 'flex-start',
      borderRadius: BORDER_RADIUS_PRIMARY
    },
    fallbackIcon: {
      backgroundColor: theme.secondaryBackground,
      alignSelf: 'flex-start',
      ...spacings.pvMi,
      ...spacings.phMi,
      borderRadius: BORDER_RADIUS_PRIMARY
    }
  })

export default getStyles
