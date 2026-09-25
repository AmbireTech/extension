import { StyleSheet, ViewStyle } from 'react-native'

import { SELECT_SIZE_TO_HEIGHT } from '@common/components/Select/styles'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  container: ViewStyle
  label: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    // Matches the closed token select on the swap screen (see Select's styles), minus the arrow
    container: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.plTy,
      ...spacings.prSm,
      height: SELECT_SIZE_TO_HEIGHT.md,
      ...common.borderRadiusPrimary,
      backgroundColor: theme.primaryBackground
    },
    label: {
      ...flexbox.flex1,
      ...spacings.mlTy
    }
  })

export default getStyles
