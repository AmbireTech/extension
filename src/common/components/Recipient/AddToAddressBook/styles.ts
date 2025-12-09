import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  addToAddressBook: ViewStyle
  addressBookButton: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    addToAddressBook: {
      maxWidth: 240
    },
    addressBookButton: {
      backgroundColor:
        themeType === THEME_TYPES.DARK ? `${theme.primary as string}14` : '#6000FF14',
      ...common.borderRadiusPrimary,
      ...spacings.phTy,
      ...common.borderRadiusPrimary,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      height: 28
    }
  })

export default getStyles
