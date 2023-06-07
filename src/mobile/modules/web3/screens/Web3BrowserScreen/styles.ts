import { StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import { SPACING_MI } from '@common/styles/spacings'

interface Style {
  container: ViewStyle
  webview: ViewStyle
  loadingWrapper: ViewStyle
  webviewButtonCommon: ViewStyle
  left: ViewStyle
  right: ViewStyle
  reload: ViewStyle
  addressInputStyle: ViewStyle
  addressInputWrapperStyle: ViewStyle
}

const styles = StyleSheet.create<Style>({
  container: {
    backgroundColor: 'transparent'
  },
  webview: {
    flex: 1,
    backgroundColor: colors.white
  },
  loadingWrapper: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  webviewButtonCommon: {
    borderRadius: 22,
    padding: SPACING_MI
  },
  left: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  right: {
    marginRight: SPACING_MI,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reload: {
    marginLeft: SPACING_MI,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addressInputStyle: {
    height: 'auto',
    fontSize: 14
  },
  addressInputWrapperStyle: {
    height: 'auto',
    paddingVertical: SPACING_MI
  }
})

export default styles
