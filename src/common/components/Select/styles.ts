import { ImageStyle, StyleSheet, ViewProps, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  selectContainer: ViewStyle
  selectBorderWrapper: ViewStyle
  select: ViewStyle
  menuBackdrop: ViewStyle
  menuContainer: ViewStyle
  menuOption: ViewProps
  selectedItemContainerStyle: ViewProps
  searchContainerStyle: ViewProps
  searchTextInputStyle: ViewProps
  optionIcon: ImageStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    selectContainer: {
      width: '100%',
      ...spacings.mbSm
    },
    selectBorderWrapper: {
      borderWidth: 2,
      borderRadius: 8,
      borderColor: 'transparent',
      ...common.hidden
    },
    select: {
      width: '100%',
      height: 50,
      ...common.borderRadiusPrimary,
      backgroundColor: theme.secondaryBackground,
      borderWidth: 1,
      ...common.hidden,
      borderColor: 'transparent',
      ...flexbox.justifyCenter,
      ...spacings.ph
    },
    menuBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%'
    },
    menuContainer: {
      backgroundColor: theme.primaryBackground,
      ...spacings.mtMi,
      ...common.borderRadiusPrimary,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      ...common.shadowSecondary,
      position: 'absolute',
      maxHeight: 400,
      ...flexbox.flex1
    },
    menuOption: {
      height: 50,
      ...spacings.ph,
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    selectedItemContainerStyle: {
      backgroundColor: colors.howl
    },
    searchContainerStyle: {
      flexDirection: 'column-reverse',
      width: '100%',
      alignItems: 'flex-end',
      ...spacings.ph,
      ...spacings.pt,
      ...spacings.pbTy,
      borderBottomWidth: 0
    },
    searchTextInputStyle: {
      marginTop: SPACING_TY,
      width: '100%',
      height: 50,
      borderRadius: 13,
      backgroundColor: colors.howl,
      borderWidth: 0,
      fontSize: 16,
      ...spacings.phTy,
      color: colors.titan
    },
    optionIcon: {
      width: 30,
      height: 30,
      ...common.borderRadiusPrimary,
      ...spacings.mrTy
    }
  })

export default getStyles
