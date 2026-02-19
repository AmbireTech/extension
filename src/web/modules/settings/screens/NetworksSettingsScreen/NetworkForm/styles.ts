import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  modalHeader: ViewStyle
  rpcUrlsContainer: ViewStyle
  selectRpcItem: ViewStyle
  selectRpcItemBorder: ViewStyle
  radio: ViewStyle
  radioHovered: ViewStyle
  radioSelected: ViewStyle
  radioSelectedInner: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    modalHeader: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mhMi,
      ...spacings.mvMi,
      ...spacings.phXl,
      borderRadius: 12,
      height: 60,
      backgroundColor: theme.secondaryBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.neutral400
    },
    rpcUrlsContainer: {
      backgroundColor: theme.tertiaryBackground,
      ...common.borderRadiusPrimary,
      maxHeight: 104,
      ...spacings.mb
    },
    selectRpcItem: {
      ...spacings.pvMi,
      ...spacings.phTy,
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    selectRpcItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.tertiaryBackground
    },
    radio: {
      width: 16,
      height: 16,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: theme.primaryBorder,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.mrTy
    },
    radioHovered: {
      borderColor: theme.successText
    },
    radioSelected: {
      borderColor: theme.successText
    },
    radioSelectedInner: {
      backgroundColor: theme.successText,
      width: 10,
      height: 10,
      borderRadius: 50
    }
  })

export default getStyles
