import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING_MD, SPACING_XL } from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { getUiType } from '@web/utils/uiType'

interface Style {
  content: ViewStyle
  qrCodeContainer: ViewStyle
  qrCode: ViewStyle
  accountAddress: TextStyle
  copyButton: ViewStyle
  supportedNetworksContainer: ViewStyle
  supportedNetworksTitle: TextStyle
  supportedNetworks: ViewStyle
  supportedNetwork: ViewStyle
  accountAddressWrapper: ViewStyle
  seeMoreWrapper: ViewStyle
  extraNetwork: ViewStyle
  extraNetworkVisible: ViewStyle
}

const { isTab } = getUiType()

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    content: {
      backgroundColor:
        themeType === THEME_TYPES.DARK ? theme.secondaryBackground : theme.primaryBackground,
      ...common.borderRadiusPrimary,
      width: '100%'
    },
    qrCodeContainer: { ...flexbox.alignCenter, ...spacings.mvMi },
    qrCode: {
      ...common.borderRadiusPrimary,
      overflow: 'hidden'
    },
    accountAddress: {
      marginHorizontal: 'auto',
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    copyButton: {
      width: 160,
      marginHorizontal: 'auto',
      marginBottom: isTab ? SPACING_XL : SPACING_MD
    },
    supportedNetworksContainer: { ...flexbox.alignCenter, ...spacings.mb },
    supportedNetworksTitle: { ...spacings.mbSm, ...text.center },
    supportedNetworks: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      ...spacings.mbTy
    },
    supportedNetwork: {
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.mhTy,
      ...spacings.mvMi,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.secondaryBorder
    },
    accountAddressWrapper: {
      marginHorizontal: 'auto',
      ...spacings.phSm,
      ...spacings.pvSm,
      ...spacings.mbSm,
      ...common.borderRadiusPrimary,
      backgroundColor:
        themeType === THEME_TYPES.DARK ? theme.primaryBackground : theme.secondaryBackground
    },
    seeMoreWrapper: {
      ...flexbox.alignCenter
    },
    extraNetwork: {
      opacity: 0,
      transform: [{ translateY: -8 }],
      // @ts-ignore
      pointerEvents: 'none',
      position: 'absolute',
      transitionProperty: 'opacity, transform',
      transitionDuration: '500ms',
      transitionTimingFunction: 'ease'
    },
    extraNetworkVisible: {
      opacity: 1,
      transform: [{ translateY: 0 }],
      // @ts-ignore
      pointerEvents: 'auto',
      position: 'relative'
    }
  })

export default getStyles
