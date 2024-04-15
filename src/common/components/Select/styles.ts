import { ImageStyle, StyleSheet, TextProps, ViewProps, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  menuContainer: ViewStyle
  listItemContainerStyle: ViewProps
  selectedItemContainerStyle: ViewProps
  searchContainerStyle: ViewProps
  searchTextInputStyle: ViewProps
  modalContentContainerStyle: ViewProps
  listItemLabelStyle: TextProps
  iconContainerStyle: ViewProps
  extra: ViewProps
  optionIcon: ImageStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    menuContainer: {
      backgroundColor: theme.primaryBackground,
      ...spacings.mtMi,
      ...spacings.pbTy,
      zIndex: 9999
    },
    listItemLabelStyle: {
      color: theme.primaryText,
      fontSize: 14
    },
    listItemContainerStyle: {
      ...spacings.mh,
      ...spacings.phTy,
      height: 50,
      backgroundColor: 'transparent',
      ...common.borderRadiusPrimary
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
    modalContentContainerStyle: {
      backgroundColor: colors.valhalla
    },
    iconContainerStyle: {},
    extra: {
      position: 'absolute',
      height: '100%',
      right: 45,
      justifyContent: 'center'
    },
    optionIcon: {
      width: 30,
      height: 30,
      ...common.borderRadiusPrimary,
      ...spacings.mrTy
    }
  })

export default getStyles
