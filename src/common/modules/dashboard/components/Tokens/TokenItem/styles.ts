import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      display: 'flex',
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      paddingVertical: 6,
      ...spacings.phTy,
      ...(isMobile ? spacings.mvMi : {})
    }
  })

export default getStyles
