import { ImageStyle, Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import commonWebStyles from '@web/styles/utils/common'

export const HEADER_HEIGHT = Platform.select({
  web: 90,
  default: 60
})

interface Styles {
  container: ViewStyle
  containerInner: ViewStyle
  navIconContainerRegular: ViewStyle
  title: TextStyle
  sideContainer: ViewStyle
  // Account
  account: ViewStyle
  accountButton: ViewStyle
  accountButtonRightIcon: ViewStyle
  accountButtonInfo: ViewStyle
  accountButtonInfoIcon: ImageStyle
  accountButtonInfoText: TextStyle
  accountCopyIcon: ViewStyle
}

const styles = StyleSheet.create<Styles>({
  container: {
    zIndex: 9,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.zircon,
    ...spacings.ph,
    ...spacings.pv,
    ...(isWeb ? { height: 90 } : {})
  },
  containerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    ...commonWebStyles.contentContainer
  },
  navIconContainerRegular: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    textAlign: 'center',
    flex: 1,
    ...spacings.phTy
  },
  sideContainer: {
    width: isWeb ? 180 : 120,
    minWidth: isWeb ? 180 : 120
  },
  // Account
  account: {
    ...flexbox.directionRow,
    ...flexbox.alignCenter
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    ...spacings.phTy,
    backgroundColor: '#B6B9FF26',
    borderWidth: 1,
    borderColor: '#6770B333',
    borderRadius: 12,
    minWidth: 235
  },
  accountButtonRightIcon: { borderColor: 'transparent', borderRadius: 10 },
  accountButtonInfo: { ...flexbox.directionRow, ...flexbox.alignCenter },
  accountButtonInfoIcon: { width: 30, height: 30, borderRadius: 10 },
  accountButtonInfoText: { ...spacings.mlTy },
  accountCopyIcon: { backgroundColor: 'transparent', borderColor: 'transparent' }
})

export default styles
