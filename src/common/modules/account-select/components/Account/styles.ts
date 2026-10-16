import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  accountContainer: ViewStyle
  label: TextStyle
  separator: ViewStyle
}

// One line of badges under the avatar, the label and the address, with a separator between
// them. Rows whose badges wrap are taller, which they report to the list, see `onExtraHeightChange`
export const ACCOUNT_SELECT_ACCOUNT_HEIGHT = isWeb ? 95 : 97
export const ACCOUNT_SELECT_ACCOUNT_MB = SPACING_TY
/** Also the size of the icons in place of it in rows like it, see `SyncOptionRow` */
export const ACCOUNT_AVATAR_SIZE = 36

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    accountContainer: {
      ...spacings.plSm,
      ...spacings.prTy,
      ...spacings.pvTy,
      ...common.borderRadiusPrimary,
      // Always there, so that marking the row as selected does not move its content
      borderWidth: 1,
      borderColor: 'transparent',
      marginBottom: ACCOUNT_SELECT_ACCOUNT_MB
    },
    label: {
      flexShrink: 1,
      ...spacings.mrTy
    },
    separator: {
      height: 1,
      backgroundColor: theme.secondaryBorder,
      ...spacings.mvTy,
      ...(isWeb && { marginTop: SPACING_TY - 2 })
    }
  })

export default getStyles
