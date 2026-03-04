import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING_MD, SPACING_XL } from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { getUiType } from '@common/utils/uiType'

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
    qrCodeContainer: { ...flexbox.alignCenter, ...spacings.mb },
    qrCode: {
      ...spacings.phTy,
      ...spacings.pvTy,
      ...common.borderRadiusPrimary,
      backgroundColor: themeType === THEME_TYPES.DARK ? '#fff' : theme.secondaryBackground,
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
    supportedNetworksContainer: {
      ...flexbox.alignCenter,
      ...spacings.mb,
      borderTopWidth: 1,
      borderBottomWidth: 0,
      borderColor: theme.neutral100
    },
    supportedNetworksTitle: { ...spacings.mbSm, ...text.center, ...spacings.mt },
    supportedNetworks: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      maxWidth: 500,
      ...spacings.mbTy
    },
    supportedNetwork: {
      ...flexbox.center,
      ...spacings.mhMi,
      ...spacings.mvMi,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.secondaryBorder
    },
    accountAddressWrapper: {
      marginHorizontal: 'auto',
      ...flexbox.center,
      ...spacings.phSm,
      ...spacings.pvSm,
      ...spacings.mbSm,
      ...common.borderRadiusPrimary,
      backgroundColor: theme.secondaryBackground
    },
    seeMoreWrapper: {
      ...flexbox.directionRow,
      ...flexbox.center
    },
    extraNetwork: {
      opacity: 0,
      transform: [{ translateY: -8 }],
      // @ts-ignore
      pointerEvents: 'none',
      position: 'absolute',
      // @ts-ignore prop doesn't exist on ViewStyle, used for web
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
