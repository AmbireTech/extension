import { StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import { DEVICE_WIDTH, SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
  webview: ViewStyle
  loadingWrapper: ViewStyle
  statusContainer: ViewStyle
  statusContainerContent: ViewStyle
}

const styles = StyleSheet.create<Style>({
  container: {
    backgroundColor: 'transparent'
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  loadingWrapper: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusContainer: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    right: 0,
    bottom: 110
  },
  statusContainerContent: {
    minHeight: 250,
    width: DEVICE_WIDTH - SPACING_SM * 2,
    backgroundColor: colors.clay,
    borderRadius: BORDER_RADIUS_PRIMARY,
    borderColor: colors.wooed,
    borderWidth: 1
  }
})

export default styles
