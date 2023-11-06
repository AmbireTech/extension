import { Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import spacings, { SPACING_3XL, SPACING_LG } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import commonWebStyles from '@web/styles/utils/common'
import { getUiType } from '@web/utils/uiType'

export const HEADER_HEIGHT = Platform.select({
  web: 90,
  default: 60
})

interface Styles {
  container: ViewStyle
  containerInner: ViewStyle
  navIconContainerRegular: ViewStyle
  title: TextStyle
  sideContainer: ViewStyle
}

const isTab = getUiType().isTab

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    container: {
      zIndex: 9,
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isTab ? SPACING_3XL : SPACING_LG,
      backgroundColor: theme.secondaryBackground,
      ...spacings.pv,
      ...(isWeb ? { height: 90 } : {})
    },
    containerInner: {
      flexDirection: 'row',
      alignItems: 'center',
      ...commonWebStyles.contentContainer,
      flex: 1
    },
    navIconContainerRegular: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center'
    },
    title: {
      textAlign: 'center',
      flex: 1,
      ...spacings.phTy
    },
    sideContainer: {
      width: 120,
      minWidth: 120
    }
  })

export default getStyles
