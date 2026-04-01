import { StyleSheet, ViewStyle } from 'react-native'

import { isAndroid, isiOS } from '@common/config/env'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

interface Style {
  footerContainer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    footerContainer: {
      borderTopStartRadius: BORDER_RADIUS_PRIMARY,
      borderTopEndRadius: BORDER_RADIUS_PRIMARY,
      ...(isiOS && {
        shadowOffset: { width: 0, height: -2 },
        shadowColor: theme.primaryAccent400,
        shadowOpacity: 1,
        shadowRadius: 0
      }),
      ...(isAndroid && {
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: theme.primaryAccent400,
        marginHorizontal: -2
      }),
      backgroundColor: theme.primaryBackground,
      ...spacings.phSm,
      ...spacings.pbSm
    }
  })

export default getStyles
