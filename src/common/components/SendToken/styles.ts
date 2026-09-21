import { StyleSheet } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create({
    outerContainer: {
      borderWidth: 2,
      borderRadius: BORDER_RADIUS_PRIMARY,
      borderColor: theme.secondaryBackground,
      overflow: 'hidden'
    },
    outerContainerError: {
      borderColor: theme.errorBackground
    },
    containerError: {
      borderWidth: 1,
      borderColor: theme.errorDecorative
    },
    balanceRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.mbSm,
      minHeight: 24
    },
    switchAmountFieldMode: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyEnd,
      ...flexbox.flex1,
      ...spacings.plTy,
      minWidth: 0
    },
    switchAmountFieldModeValue: {
      ...spacings.mrTy,
      flexShrink: 1
    },
    switchAmountFieldModeIcon: {
      ...flexbox.center,
      width: 20,
      height: 20,
      borderRadius: 10
    },
    slider: {
      ...spacings.ptSm,
      // The value bubble sits above the track, over the amount input, which carries a zIndex of
      // its own (see Input's styles)
      zIndex: 11
    }
  })
export default getStyles
