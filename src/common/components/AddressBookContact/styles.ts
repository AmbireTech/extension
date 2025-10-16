import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  addressBookButton: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    addressBookButton: {
      backgroundColor:
        themeType === THEME_TYPES.DARK ? `${theme.primary as string}14` : '#6000FF14',
      ...common.borderRadiusPrimary,
      ...spacings.phSm,
      ...common.borderRadiusPrimary,
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    }
  })

export default getStyles
