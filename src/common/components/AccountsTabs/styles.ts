import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  tab: ViewStyle
  activeTab: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    // The search above has no margin of its own, so the tabs keep their distance from it. The
    // distance to the list is a margin too: padding on the list would scroll the rows up to the tabs
    container: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.phTy,
      ...spacings.mtSm,
      ...spacings.mbSm,
      columnGap: SPACING_TY
    },
    tab: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.plMi,
      ...spacings.prSm,
      ...spacings.pvMi,
      columnGap: SPACING_MI,
      borderRadius: 50
    },
    activeTab: {
      backgroundColor: theme.secondaryBackground
    }
  })

export default getStyles
