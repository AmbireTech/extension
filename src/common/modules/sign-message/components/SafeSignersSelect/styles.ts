import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING_LG } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
  overlay: ViewStyle
  title: TextStyle
  signer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...spacings.pvSm,
      ...spacings.phSm,
      position: 'absolute',
      bottom: 64,
      transform: [
        {
          translateY: -SPACING_LG
        }
      ],
      ...common.borderRadiusPrimary,
      ...common.shadowPrimary,
      backgroundColor: theme.secondaryBackground,
      zIndex: 8,
      overflow: 'hidden'
    },
    overlay: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      backgroundColor: theme.backdrop,
      zIndex: 7
    },
    title: {
      ...spacings.pvTy,
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryBorder,
      borderTopLeftRadius: BORDER_RADIUS_PRIMARY,
      borderTopRightRadius: BORDER_RADIUS_PRIMARY
    },
    signer: { ...spacings.pvTy, ...spacings.ph }
  })

export default getStyles
