import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  addressBookButton: ViewStyle
  confirmAddressWrapper: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    confirmAddressWrapper: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...(isMobile ? flexbox.wrap : {})
    },
    addressBookButton: {
      ...spacings.phTy,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...(isMobile && flexbox.justifyCenter),
      height: isMobile ? 40 : 32,
      borderRadius: isMobile ? BORDER_RADIUS_PRIMARY : 64
    }
  })

export default getStyles
