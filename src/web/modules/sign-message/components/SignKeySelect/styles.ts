import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING_LG } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  overlay: ViewStyle
  title: TextStyle
  signer: ViewStyle
  spinner: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      position: 'absolute',
      bottom: 64,
      transform: [
        {
          translateY: -SPACING_LG
        }
      ],
      ...common.borderRadiusPrimary,
      ...common.shadowPrimary,
      backgroundColor: theme.primaryBackground,
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
      ...spacings.pl,
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryBorder,
      backgroundColor: theme.secondaryBackground,
      borderTopLeftRadius: BORDER_RADIUS_PRIMARY,
      borderTopRightRadius: BORDER_RADIUS_PRIMARY
    },
    signer: { ...spacings.pvTy, ...spacings.ph },
    spinner: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      ...flexbox.center
    }
  })

export default getStyles
