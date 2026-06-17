import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings, { SPACING_MI, SPACING_SM, SPACING_TY, SPACING_XL } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  network: ViewStyle
  noKebabNetwork: ViewStyle
  highlightedNetwork: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    network: {
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...flexbox.directionRow,
      ...spacings.phSm,
      ...spacings.pvSm,
      marginBottom: isMobile ? 0 : SPACING_MI / 2,
      borderRadius: BORDER_RADIUS_PRIMARY
    },
    noKebabNetwork: {
      paddingRight: isMobile ? SPACING_SM : SPACING_XL + SPACING_TY
    },
    highlightedNetwork: {
      backgroundColor: theme.secondaryBackground,
      borderColor: theme.secondaryBorder
    }
  })

export default getStyles
