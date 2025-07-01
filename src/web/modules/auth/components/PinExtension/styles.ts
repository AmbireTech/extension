import { StyleSheet, ViewStyle } from 'react-native'

import { BOTTOM_SHEET_Z_INDEX } from '@common/components/BottomSheet/styles'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  pinExtensionContainer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    pinExtensionContainer: {
      position: 'absolute',
      top: 4,
      zIndex: BOTTOM_SHEET_Z_INDEX,
      ...spacings.pvSm,
      ...spacings.phSm,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      shadowColor: '#2D314D3D',
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
      ...common.borderRadiusSecondary,
      backgroundColor: theme.primaryBackground
    }
  })

export default getStyles
