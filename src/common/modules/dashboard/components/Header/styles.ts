import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  accountButton: ViewStyle
  accountButtonRightIcon: ViewStyle
  accountButtonInfo: ViewStyle
  accountButtonInfoIcon: ImageStyle
  accountCopyIcon: ViewStyle
  maximizeAndMenu: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    // Account
    accountButton: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      height: 40,
      maxWidth: 412,
      ...spacings.phMi,
      ...common.borderRadiusPrimary,
      ...spacings.mrSm
    },
    accountButtonRightIcon: {
      borderColor: 'transparent',
      ...common.borderRadiusPrimary,
      ...spacings.mrTy
    },
    accountButtonInfo: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.flex1,
      ...spacings.mrMi
    },
    accountButtonInfoIcon: { width: 32, height: 32, ...common.borderRadiusPrimary },
    accountCopyIcon: { backgroundColor: 'transparent', borderColor: 'transparent' },
    maximizeAndMenu: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mlLg
    }
  })

export default getStyles
