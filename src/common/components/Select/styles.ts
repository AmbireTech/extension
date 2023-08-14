import { StyleSheet, TextProps, ViewProps } from 'react-native'

import { FONT_FAMILIES } from '@common/hooks/useFonts'
import colors from '@common/styles/colors'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'

interface Style {
  dropdown: ViewProps
  listItemContainerStyle: ViewProps
  selectedItemContainerStyle: ViewProps
  searchContainerStyle: ViewProps
  searchTextInputStyle: ViewProps
  modalContentContainerStyle: ViewProps
  labelStyle: TextProps
  listItemLabelStyle: TextProps
  iconContainerStyle: ViewProps
  extra: ViewProps
  optionIcon: ViewProps
}

const styles = StyleSheet.create<Style>({
  dropdown: {
    backgroundColor: colors.melrose_15,
    ...commonStyles.borderRadiusPrimary,
    borderWidth: 1,
    borderColor: colors.scampi_20,
    height: 50,
    ...spacings.mbSm
  },
  labelStyle: {
    color: colors.martinique,
    fontSize: 14,
    fontFamily: FONT_FAMILIES.LIGHT
  },
  listItemLabelStyle: {
    color: colors.martinique,
    fontSize: 14
  },
  listItemContainerStyle: {
    ...spacings.mh,
    ...spacings.phTy,
    height: 50,
    backgroundColor: 'transparent',
    ...commonStyles.borderRadiusPrimary
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
    borderRadius: 10,
    ...spacings.mrTy
  }
})

export default styles
