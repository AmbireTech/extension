import { StyleSheet, ViewStyle } from 'react-native'

import { isiOS, isWeb } from '@common/config/env'
import { TAB_BAR_HEIGHT } from '@common/constants/router'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import colors from '@common/styles/colors'
import { IS_SCREEN_SIZE_L, SPACING_TY } from '@common/styles/spacings'

interface Style {
  tabBarContainer: ViewStyle
  backdropBlurWrapper: ViewStyle
  tabBarContainerWeb: ViewStyle
  transactionsBadge: ViewStyle
}

const tabBarContainerBackground = !isiOS ? { backgroundColor: colors.valhalla } : {}
const tabBarBackground = isiOS ? { backgroundColor: 'transparent' } : {}

export const drawerStyle = {
  backgroundColor: colors.clay,
  borderTopRightRadius: 13,
  borderBottomRightRadius: 13,
  width: 282
}

export const drawerWebStyle = {
  backgroundColor: colors.clay,
  borderTopLeftRadius: 13,
  borderBottomLeftRadius: 13,
  width: 290
}

export const headerStyle = {
  backgroundColor: 'transparent'
}

export const headerTitleStyle = {
  fontSize: 18,
  fontFamily: FONT_FAMILIES.REGULAR
}

export const tabBarStyle = {
  ...tabBarBackground,
  borderColor: colors.waikawaGray,
  borderWidth: 1,
  // border top width and color should be specified separately
  borderTopColor: colors.waikawaGray,
  borderTopWidth: 1,
  borderBottomWidth: 0,
  height: TAB_BAR_HEIGHT,
  borderTopLeftRadius: 13,
  borderTopRightRadius: 13,
  paddingHorizontal: SPACING_TY
}

export const tabBarWebStyle = {
  backgroundColor: 'transparent',
  borderColor: colors.waikawaGray,
  borderWidth: 1,
  // border top width and color should be specified separately
  borderTopColor: colors.waikawaGray,
  borderTopWidth: 1,
  borderLeftWidth: 0,
  borderRightWidth: 0,
  borderBottomWidth: 0,
  minHeight: TAB_BAR_HEIGHT
}

export const tabBarItemStyle = {
  paddingTop: 8,
  paddingBottom: 12
}

export const tabBarItemWebStyle = {
  paddingTop: 12,
  paddingBottom: 18
}

export const horizontalTabBarLabelStyle = {
  fontSize: 16,
  paddingLeft: IS_SCREEN_SIZE_L ? 10 : 0
}

export const tabBarLabelStyle = {
  fontSize: isWeb ? 12 : 9
}

export const navigationContainerDarkTheme = {
  dark: true,
  colors: {
    primary: colors.clay,
    background: colors.clay,
    card: colors.clay,
    text: colors.titan,
    border: 'transparent',
    notification: colors.clay
  }
}

const styles = StyleSheet.create<Style>({
  tabBarContainer: {
    ...tabBarContainerBackground,
    borderTopRightRadius: 13,
    borderTopLeftRadius: 13,
    overflow: 'hidden',
    width: '100%',
    position: 'absolute',
    bottom: 0
  },
  tabBarContainerWeb: {
    backgroundColor: 'transparent',
    height: TAB_BAR_HEIGHT,
    minHeight: TAB_BAR_HEIGHT,
    maxHeight: TAB_BAR_HEIGHT,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
    overflow: 'hidden',
    borderTopColor: colors.waikawaGray,
    borderTopWidth: 1
  },
  backdropBlurWrapper: {
    width: '100%',
    backgroundColor: colors.martinique,
    overflow: 'hidden'
  },
  transactionsBadge: {
    borderRadius: 50,
    backgroundColor: colors.pink,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -7,
    right: -9
  }
})

export default styles
