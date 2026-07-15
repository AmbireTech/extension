import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile, isWeb } from '@common/config/env'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  modalHeader: ViewStyle
  rpcUrlsContainer: ViewStyle
  selectRpcItem: ViewStyle
  selectRpcItemBorder: ViewStyle
  radio: ViewStyle
  radioSelectedInner: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    modalHeader: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...(isWeb ? spacings.mhMi : {}),
      ...(isWeb ? spacings.mvMi : {}),
      ...(isMobile ? spacings.mbSm : {}),
      ...(isMobile ? spacings.phSm : spacings.phXl),
      borderRadius: 12,
      height: 60,
      backgroundColor: theme.secondaryBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.neutral400
    },
    rpcUrlsContainer: {
      backgroundColor: theme.secondaryBackground,
      ...common.borderRadiusPrimary,
      maxHeight: isMobile ? 200 : 110,
      ...(isMobile ? spacings.mbSm : spacings.mb),
      ...(isMobile ? spacings.phTy : {})
    },
    selectRpcItem: {
      ...(isMobile ? spacings.pvTy : spacings.pvMi),
      ...spacings.phTy,
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    selectRpcItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryBackground
    },
    radio: {
      width: 16,
      height: 16,
      borderRadius: 50,
      borderWidth: 2,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.mrTy,
      borderColor: theme.success400
    },

    radioSelectedInner: {
      backgroundColor: theme.success400,
      width: 8,
      height: 8,
      borderRadius: 50
    }
  })

export default getStyles
