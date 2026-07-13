import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...(isMobile ? spacings.ph : spacings.phMd),
      ...(isMobile ? spacings.pv : spacings.pvMd),
      ...common.borderRadiusPrimary,
      backgroundColor: theme.info100
    }
  })

export default getStyles
