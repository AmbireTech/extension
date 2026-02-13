import { ImageStyle, StyleSheet, ViewProps, ViewStyle } from 'react-native'

import { BOTTOM_SHEET_Z_INDEX } from '@common/components/BottomSheet/styles'
import spacings, { SPACING_MI } from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  selectContainer: ViewStyle
  selectBorderWrapper: ViewStyle
  select: ViewStyle
  smSelect: ViewStyle
  mdSelect: ViewStyle
  menuContainer: ViewStyle
  menuOption: ViewProps
  smMenuOption: ViewStyle
  mdMenuOption: ViewStyle
  sheetMenuOption: ViewStyle
  optionIcon: ImageStyle
}

export const DEFAULT_SELECT_SIZE = 'md'
export const SELECT_SIZE_TO_HEIGHT = {
  sm: 36,
  md: 50
}
export const MAX_MENU_HEIGHT = 400

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    selectContainer: {
      width: '100%',
      ...spacings.mbSm
    },
    selectBorderWrapper: {
      borderRadius: 8,
      ...common.hidden
    },
    select: {
      width: '100%',
      ...common.borderRadiusPrimary,
      backgroundColor: theme.primaryBackground,
      ...common.hidden,
      ...flexbox.alignCenter,
      ...flexbox.directionRow
    },
    smSelect: {
      height: SELECT_SIZE_TO_HEIGHT.sm,
      ...spacings.phTy
    },
    mdSelect: {
      height: SELECT_SIZE_TO_HEIGHT.md,
      ...spacings.ph
    },
    menuContainer: {
      backgroundColor: theme.primaryBackground,
      ...spacings.mvMi,
      ...common.borderRadiusPrimary,
      overflow: 'hidden',
      ...common.shadowSecondary,
      position: 'absolute',
      maxHeight: MAX_MENU_HEIGHT,
      ...flexbox.flex1,
      zIndex: BOTTOM_SHEET_Z_INDEX + 1
    },
    menuOption: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    sheetMenuOption: {
      marginBottom: SPACING_MI / 2,
      borderRadius: BORDER_RADIUS_PRIMARY
    },
    smMenuOption: {
      height: SELECT_SIZE_TO_HEIGHT.sm,
      ...spacings.phTy
    },
    mdMenuOption: {
      height: SELECT_SIZE_TO_HEIGHT.md,
      ...spacings.ph
    },
    optionIcon: {
      width: 30,
      height: 30,
      borderRadius: BORDER_RADIUS_PRIMARY,
      ...(spacings.mrTy as ImageStyle) // TODO: spacings has type mismatch with ImageStyle
    }
  })

export default getStyles
