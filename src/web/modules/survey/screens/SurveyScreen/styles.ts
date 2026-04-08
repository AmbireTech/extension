import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  selectItem: ViewStyle
  selectItemBorder: ViewStyle
  radio: ViewStyle
  radioSelectedInner: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    selectItem: {
      ...spacings.pvMi,
      ...spacings.phTy,
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    selectItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryBackground
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 50,
      borderWidth: 2,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.mrTy,
      borderColor: '#808EA2'
    },

    radioSelectedInner: {
      backgroundColor: theme.success400,
      width: 12,
      height: 12,
      borderRadius: 50
    }
  })

export default getStyles
