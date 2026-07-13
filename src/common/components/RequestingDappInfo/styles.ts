import { ImageStyle, StyleSheet } from 'react-native'

import { isMobile } from '@common/config/env'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

interface Style {
  image: ImageStyle
  fallbackIcon: ImageStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    image: {
      alignSelf: isMobile ? 'center' : 'flex-start',
      borderRadius: BORDER_RADIUS_PRIMARY
    },
    fallbackIcon: {
      backgroundColor: theme.secondaryBackground,
      alignSelf: isMobile ? 'center' : 'flex-start',
      borderRadius: BORDER_RADIUS_PRIMARY
    }
  })

export default getStyles
