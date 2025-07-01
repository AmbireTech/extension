import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { IS_MOBILE_UP_BENZIN_BREAKPOINT } from '@benzin/screens/BenzinScreen/styles'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  step: ViewStyle
  icon: ViewStyle
  circle: ViewStyle
  nextCircle: ViewStyle
  title: TextStyle
  arrow: ViewStyle
  arrowHovered: ViewStyle
}

const iconStyle: ViewStyle = {
  width: 18,
  height: 18,
  position: 'absolute',
  left: -8,
  zIndex: 3
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    step: {
      position: 'relative',
      borderColor: theme.secondaryBorder,
      ...flexbox.directionRow
    },
    icon: iconStyle,
    circle: {
      ...iconStyle,
      borderRadius: 9,
      backgroundColor: theme.primaryBackground,
      borderWidth: 2,
      borderColor: theme.secondaryBorder
    },
    nextCircle: {
      borderColor: theme.successDecorative
    },
    title: {
      ...spacings.mrMi,
      ...(IS_MOBILE_UP_BENZIN_BREAKPOINT ? spacings.mb : spacings.mbSm),
      textTransform: 'capitalize',
      lineHeight: 18 // must be the same as font-size
    },
    arrow: {
      ...spacings.pvTy,
      ...spacings.phMi,
      ...spacings.mlMi,
      color: theme.linkText
    },
    arrowHovered: {
      backgroundColor: `${String(theme.linkText)}14`,
      ...common.borderRadiusPrimary
    }
  })

export default getStyles
