import { ViewStyle } from 'react-native'

import { isAndroid, isiOS } from '@common/config/env'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

/**
 * The mobile footer that holds the network fee and the sign buttons: a card with rounded top
 * corners and a purple line along its top edge, over the transaction details above it.
 */
const getFeeFooterContainerStyle = (theme: ThemeProps): ViewStyle => ({
  borderTopStartRadius: BORDER_RADIUS_PRIMARY,
  borderTopEndRadius: BORDER_RADIUS_PRIMARY,
  ...(isiOS && {
    shadowOffset: { width: 0, height: -2 },
    shadowColor: theme.primaryAccent400,
    shadowOpacity: 1,
    shadowRadius: 0
  }),
  ...(isAndroid && {
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: theme.primaryAccent400,
    marginHorizontal: -2
  }),
  backgroundColor: theme.primaryBackground,
  ...spacings.phSm,
  ...spacings.ptSm
})

export default getFeeFooterContainerStyle
