import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  button: ViewStyle
  dropdown: ViewStyle
  overlay: ViewStyle
  item: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    button: {
      width: 24,
      height: 24,
      position: 'relative',
      ...flexbox.justifyCenter,
      ...flexbox.alignCenter
    },
    dropdown: {
      position: 'absolute',
      backgroundColor: theme.secondaryBackground,
      minWidth: 160,
      ...common.shadowSecondary,
      ...common.borderRadiusPrimary,
      ...(isMobile ? { shadowColor: theme.neutral400 } : {}),
      ...(isMobile ? { shadowOffset: { width: 0, height: 1 } } : {}),
      ...(isMobile ? { shadowOpacity: 1 } : {}),
      ...(isMobile ? { shadowRadius: 8 } : {})
    },
    overlay: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.backdrop
    },
    item: {
      ...spacings.phSm,
      ...common.borderRadiusPrimary,
      height: 40,
      ...flexbox.justifyCenter
    }
  })

export default getStyles
