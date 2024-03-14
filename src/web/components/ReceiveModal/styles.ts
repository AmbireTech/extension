import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, {
  SPACING,
  SPACING_LG,
  SPACING_MD,
  SPACING_MI,
  SPACING_TY,
  SPACING_XL
} from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
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
}

const { isTab } = getUiType()

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    content: {
      backgroundColor: theme.secondaryBackground,
      paddingTop: isTab ? SPACING_XL : SPACING_MD,
      paddingBottom: isTab ? SPACING : SPACING_TY,
      ...common.borderRadiusPrimary,
      marginBottom: isTab ? SPACING_LG : SPACING,
      width: '100%'
    },
    qrCodeContainer: { ...flexbox.alignCenter, ...spacings.mb },
    qrCode: {
      ...common.borderRadiusPrimary,
      overflow: 'hidden'
    },
    accountAddress: {
      marginHorizontal: 'auto',
      ...spacings.mbXl,
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
      // So that, ideally, 4 network items fit on a row (if their name is not huge)
      marginHorizontal: -(SPACING_MI / 2)
    },
    supportedNetwork: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryBackground,
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      ...spacings.phMi,
      ...spacings.pvMi,
      margin: SPACING_MI / 2,
      ...common.borderRadiusPrimary,
      minWidth: 86,
      height: 50
    }
  })

export default getStyles
