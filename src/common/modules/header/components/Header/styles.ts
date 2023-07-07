import { Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import colors from '@common/styles/colors'
import commonStyles from '@common/styles/utils/common'

export const HEADER_HEIGHT = Platform.select({
  web: 70,
  default: 60
})

interface Styles {
  container: ViewStyle
  wrapper: ViewStyle
  navIconContainerRegular: ViewStyle
  navIconContainerSmall: ViewStyle
  title: TextStyle
  switcherContainer: ViewStyle
  headerNetworkIcon: ViewStyle
  networkIcon: ViewStyle
  closeIcon: ViewStyle
}

const styles = StyleSheet.create<Styles>({
  container: {
    backgroundColor: colors.wooed,
    ...(isWeb ? { height: 80 } : {})
  },
  wrapper: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row'
  },
  navIconContainerRegular: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  navIconContainerSmall: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    textAlign: 'center',
    flex: 1,
    // So it is vertically aligned well with the nav buttons,
    // even when there are none.
    paddingVertical: 7,
    paddingHorizontal: 10
  },
  switcherContainer: {
    backgroundColor: colors.valhalla,
    height: 50,
    borderRadius: 13,
    paddingLeft: 10,
    paddingRight: 15,
    marginLeft: 10,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  headerNetworkIcon: {
    width: 24,
    height: 24,
    borderRadius: 50,
    backgroundColor: colors.titan_05
  },
  networkIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.clay,
    ...commonStyles.borderRadiusPrimary
  },
  closeIcon: {
    ...commonStyles.borderRadiusPrimary,
    borderWidth: 1,
    borderColor: colors.pink,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default styles
