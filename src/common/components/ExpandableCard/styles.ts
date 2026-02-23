import { StyleSheet, ViewStyle } from 'react-native'

import { isBenzin } from '@common/config/env'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      backgroundColor: isBenzin ? theme.primaryBackground : theme.secondaryBackground,
      ...common.borderRadiusPrimary
    }
  })

export default getStyles
