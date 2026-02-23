import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  addressBookButton: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    addressBookButton: {
      ...spacings.phTy,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      height: 32,
      borderRadius: 64
    }
  })

export default getStyles
