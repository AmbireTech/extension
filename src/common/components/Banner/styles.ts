import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      ...(isMobile ? spacings.phTy : spacings.phSm),
      ...(isMobile ? spacings.pbTy : spacings.pbSm),
      ...spacings.ptTy,
      ...spacings.mbTy,
      ...commonStyles.borderRadiusPrimary,
      ...flexbox.flex1
    }
  })

export default getStyles
