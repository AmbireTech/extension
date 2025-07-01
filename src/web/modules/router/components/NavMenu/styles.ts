import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@web/utils/uiType'

interface Style {
  defaultWalletContainer: ViewStyle
  menuItem: ViewStyle
  separatorWrapper: ViewStyle
  separator: ViewStyle
}

const isPopup = getUiType().isPopup
const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    defaultWalletContainer: {
      ...spacings.phXl,
      height: isPopup ? 60 : 74,
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    menuItem: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.pv,
      ...spacings.ph,
      ...common.borderRadiusPrimary
    },
    separatorWrapper: {
      ...spacings.ph,
      ...spacings.ptSm,
      ...spacings.pb
    },
    separator: {
      width: '100%',
      height: 1,
      backgroundColor: theme.secondaryBorder,
      ...common.borderRadiusPrimary
    }
  })

export default getStyles
