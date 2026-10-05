import { StyleSheet, ViewStyle } from 'react-native'

import { SELECT_SIZE_TO_HEIGHT } from '@common/components/Select/styles'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  payWith: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    // Sized like the regular fee selector's token select
    payWith: {
      height: SELECT_SIZE_TO_HEIGHT.md,
      ...common.borderRadiusPrimary,
      backgroundColor: theme.secondaryBackground,
      ...spacings.phSm,
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    }
  })

export default getStyles
