import { StyleSheet, TextProps, ViewProps } from 'react-native'

import { FONT_FAMILIES } from '@common/hooks/useFonts'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
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
}

const styles = StyleSheet.create<Style>({
  dropdown: {
    backgroundColor: colors.howl,
    ...commonStyles.borderRadiusPrimary,
    borderWidth: 0,
    height: 56,
    ...spacings.mbSm
  },
  labelStyle: {
    color: colors.titan,
    fontSize: 16,
    fontFamily: FONT_FAMILIES.LIGHT
  },
  listItemLabelStyle: {
    color: colors.titan,
    fontSize: 16
  },
  listItemContainerStyle: {
    ...spacings.mh,
    ...spacings.phTy,
    height: 56,
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
    marginTop: 10,
    width: '100%',
    height: 56,
    borderRadius: 13,
    backgroundColor: colors.howl,
    borderWidth: 0,
    fontSize: 16,
    paddingHorizontal: 10,
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
  }
})

export default styles
