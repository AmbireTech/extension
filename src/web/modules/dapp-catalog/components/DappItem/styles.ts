import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  dappItemWrapper: ViewStyle
  container: ViewStyle
  fallbackWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    fallbackWrapper: {
      width: 30,
      height: 30,
      borderRadius: '50%',
      backgroundColor: theme.primaryLight80,
      alignItems: 'center',
      justifyContent: 'center'
    },
    dappItemWrapper: {
      flex: 1,
      height: 146,
      ...spacings.phMi,
      ...spacings.pvMi
    },
    container: {
      width: '100%',
      height: '100%',
      ...common.borderRadiusPrimary,
      ...spacings.phTy,
      ...spacings.pvTy
    }
  })

export default getStyles
